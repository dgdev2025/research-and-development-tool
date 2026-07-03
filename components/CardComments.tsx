"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createComment,
  getCommentsForCard,
  uploadCommentImages,
} from "@/lib/comments";
import { formatDate } from "@/lib/profiles";
import type { CommentWithAuthor } from "@/lib/types";
import type { FeedItem } from "@/lib/parseFeed";
import { ImageSliderModal, type SliderImage } from "./ImageSliderModal";
import { GalleryThumbSlider } from "./GalleryThumbSlider";
import { UserSilhouette } from "./UserSilhouette";

function authorEmail(comment: CommentWithAuthor): string {
  return comment.author?.email ?? "Unknown";
}

function commentImageUrls(comment: CommentWithAuthor): string[] {
  if (comment.images && comment.images.length > 0) {
    return comment.images.map((image) => image.image_url);
  }
  return comment.image_url ? [comment.image_url] : [];
}

function buildImageList(comments: CommentWithAuthor[]): SliderImage[] {
  const images: SliderImage[] = [];
  comments.forEach((comment) => {
    commentImageUrls(comment).forEach((url) => {
      images.push({ url, label: `Image ${images.length + 1}` });
    });
  });
  return images;
}

interface CardCommentsContextValue {
  comments: CommentWithAuthor[];
  allImages: SliderImage[];
  imageIndexRangesByCommentId: Map<string, number[]>;
  loading: boolean;
  body: string;
  setBody: (value: string) => void;
  imageFiles: File[];
  isDraggingOver: boolean;
  submitting: boolean;
  error: string | null;
  canSubmit: boolean;
  openSlider: (index: number) => void;
  addImageFiles: (files: FileList | File[]) => void;
  removeImageFile: (index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const CardCommentsContext = createContext<CardCommentsContextValue | null>(null);

function useCardComments() {
  const context = useContext(CardCommentsContext);
  if (!context) {
    throw new Error("CardComments components must be used within CardCommentsProvider");
  }
  return context;
}

interface CardCommentsProviderProps {
  feedId: string;
  card: FeedItem;
  userId: string;
  onCommentAdded: () => void;
  children: ReactNode;
}

export function CardCommentsProvider({
  feedId,
  card,
  userId,
  onCommentAdded,
  children,
}: CardCommentsProviderProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [body, setBody] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sliderIndex, setSliderIndex] = useState<number | null>(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getCommentsForCard(supabase, feedId, card.id);
      setComments(data);
    } catch {
      setError("Failed to load comments.");
    } finally {
      setLoading(false);
    }
  }, [feedId, card.id]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const allImages = useMemo(() => buildImageList(comments), [comments]);

  const imageIndexRangesByCommentId = useMemo(() => {
    const map = new Map<string, number[]>();
    let cursor = 0;
    comments.forEach((comment) => {
      const count = commentImageUrls(comment).length;
      if (count > 0) {
        map.set(
          comment.id,
          Array.from({ length: count }, (_, i) => cursor + i)
        );
        cursor += count;
      }
    });
    return map;
  }, [comments]);

  const openSlider = (index: number) => {
    setSliderIndex(index);
  };

  const addImageFiles = (files: FileList | File[]) => {
    const imagesOnly = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (imagesOnly.length === 0) return;
    setImageFiles((prev) => [...prev, ...imagesOnly]);
  };

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files?.length) {
      addImageFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody && imageFiles.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const imageUrls =
        imageFiles.length > 0
          ? await uploadCommentImages(supabase, userId, imageFiles)
          : [];

      const comment = await createComment(supabase, {
        feedId,
        cardId: card.id,
        userId,
        body: trimmedBody,
        imageUrls,
      });

      setComments((prev) => [...prev, comment]);
      setBody("");
      setImageFiles([]);
      onCommentAdded();
    } catch {
      setError("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = Boolean(body.trim() || imageFiles.length > 0);

  const value: CardCommentsContextValue = {
    comments,
    allImages,
    imageIndexRangesByCommentId,
    loading,
    body,
    setBody,
    imageFiles,
    isDraggingOver,
    submitting,
    error,
    canSubmit,
    openSlider,
    addImageFiles,
    removeImageFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit,
  };

  return (
    <CardCommentsContext.Provider value={value}>
      {children}
      {sliderIndex !== null && allImages.length > 0 && (
        <ImageSliderModal
          images={allImages}
          initialIndex={sliderIndex}
          onClose={() => setSliderIndex(null)}
        />
      )}
    </CardCommentsContext.Provider>
  );
}

export function CardCommentGallery() {
  const { allImages, openSlider } = useCardComments();

  if (allImages.length === 0) return null;

  return (
    <div className="image-gallery">
      <p className="gallery-label">Attached images</p>
      <GalleryThumbSlider images={allImages} onImageClick={openSlider} />
    </div>
  );
}

export function CardCommentPanel() {
  const {
    comments,
    allImages,
    imageIndexRangesByCommentId,
    loading,
    body,
    setBody,
    imageFiles,
    isDraggingOver,
    submitting,
    error,
    canSubmit,
    openSlider,
    addImageFiles,
    removeImageFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSubmit,
  } = useCardComments();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "2.5rem";
    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight);
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight || textarea.scrollHeight);
    textarea.style.height = `${nextHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [body, adjustTextareaHeight]);

  return (
    <div className="card-comments-panel">
      {loading ? (
        <p className="comments-loading">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="comments-empty">No comments yet. Be the first to comment.</p>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            const imageIndexes = imageIndexRangesByCommentId.get(comment.id) ?? [];

            return (
              <article key={comment.id} className="comment-item">
                <div className="comment-avatar" aria-hidden="true">
                  <UserSilhouette size={20} />
                </div>
                <div className="comment-content">
                  <div className="comment-meta">
                    <strong>{authorEmail(comment)}</strong>
                    <span>{formatDate(comment.created_at)}</span>
                  </div>
                  {comment.body && <p className="comment-body">{comment.body}</p>}
                  {imageIndexes.length > 0 && (
                    <div className="comment-image-chips">
                      {imageIndexes.map((imageIndex) => (
                        <button
                          key={imageIndex}
                          type="button"
                          className="image-link-chip image-link-chip-inline"
                          onClick={() => openSlider(imageIndex)}
                        >
                          {allImages[imageIndex]?.label ?? `Image ${imageIndex + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="comment-form-inline">
        {error && <div className="error-msg">{error}</div>}
        {imageFiles.length > 0 && (
          <div className="pending-image-row">
            {imageFiles.map((file, index) => (
              <span key={`${file.name}-${index}`} className="pending-image-chip">
                <span className="pending-image-label">
                  {`Image ${allImages.length + index + 1}`}
                </span>
                <button
                  type="button"
                  className="pending-image-remove"
                  onClick={() => removeImageFile(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div
          className={`comment-input-row${isDraggingOver ? " drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label className="comment-attach-btn" title="Attach images" aria-label="Attach images">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21.44 11.05l-9.19 9.19a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.19 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.49"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files?.length) {
                  addImageFiles(e.target.files);
                }
                e.target.value = "";
              }}
            />
          </label>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!submitting && canSubmit) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
            placeholder={
              isDraggingOver ? "Drop images to attach..." : "Write a comment..."
            }
            rows={1}
            className="comment-input-textarea"
          />
          <button
            type="submit"
            className="comment-send-btn"
            disabled={submitting || !canSubmit}
            aria-label="Send comment"
            title="Send"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12h16M13 5l7 7-7 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
