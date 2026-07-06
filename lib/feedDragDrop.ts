import { arrayMove } from "@dnd-kit/sortable";
import type { FeedCategory, FeedItem, ParsedFeed } from "./parseFeed";
import { findFeedItem } from "./parseFeed";

export const CONTAINER_PREFIX = "container:";

const SUBSECTION_SEP = "\u001f";

export interface FeedContainerRef {
  categoryTitle: string;
  subsectionTitle?: string;
}

export function makeContainerId(ref: FeedContainerRef): string {
  if (ref.subsectionTitle) {
    return `${CONTAINER_PREFIX}${ref.categoryTitle}${SUBSECTION_SEP}${ref.subsectionTitle}`;
  }
  return `${CONTAINER_PREFIX}${ref.categoryTitle}`;
}

export function parseContainerId(id: string): FeedContainerRef | null {
  if (!id.startsWith(CONTAINER_PREFIX)) return null;
  const rest = id.slice(CONTAINER_PREFIX.length);
  const sep = rest.indexOf(SUBSECTION_SEP);
  if (sep === -1) return { categoryTitle: rest };
  return {
    categoryTitle: rest.slice(0, sep),
    subsectionTitle: rest.slice(sep + 1),
  };
}

const CONTAINER_END_SUFFIX = "\u001eend";

export function isContainerId(id: string): boolean {
  return id.startsWith(CONTAINER_PREFIX) && !id.endsWith(CONTAINER_END_SUFFIX);
}

export function makeContainerEndId(ref: FeedContainerRef): string {
  return `${makeContainerId(ref)}${CONTAINER_END_SUFFIX}`;
}

export function isContainerEndId(id: string): boolean {
  return id.startsWith(CONTAINER_PREFIX) && id.endsWith(CONTAINER_END_SUFFIX);
}

export function parseContainerEndId(id: string): FeedContainerRef | null {
  if (!isContainerEndId(id)) return null;
  return parseContainerId(id.slice(0, -CONTAINER_END_SUFFIX.length));
}

function sameContainer(a: FeedContainerRef, b: FeedContainerRef): boolean {
  return (
    a.categoryTitle === b.categoryTitle &&
    a.subsectionTitle === b.subsectionTitle
  );
}

function getContainerItems(
  category: FeedCategory,
  ref: FeedContainerRef
): FeedItem[] {
  if (ref.subsectionTitle) {
    return (
      category.subsections.find((sub) => sub.title === ref.subsectionTitle)
        ?.items ?? []
    );
  }
  return category.items;
}

function updateCategoryItems(
  categories: FeedCategory[],
  ref: FeedContainerRef,
  items: FeedItem[]
): FeedCategory[] {
  return categories.map((category) => {
    if (category.title !== ref.categoryTitle) return category;

    if (ref.subsectionTitle) {
      return {
        ...category,
        subsections: category.subsections.map((subsection) =>
          subsection.title === ref.subsectionTitle
            ? { ...subsection, items }
            : subsection
        ),
      };
    }

    return { ...category, items };
  });
}

function removeItemFromContainer(
  categories: FeedCategory[],
  ref: FeedContainerRef,
  cardId: string
): { categories: FeedCategory[]; item: FeedItem | null } {
  const category = categories.find((cat) => cat.title === ref.categoryTitle);
  if (!category) return { categories, item: null };

  const items = getContainerItems(category, ref);
  const item = items.find((entry) => entry.id === cardId);
  if (!item) return { categories, item: null };

  return {
    categories: updateCategoryItems(
      categories,
      ref,
      items.filter((entry) => entry.id !== cardId)
    ),
    item,
  };
}

function insertItemIntoContainer(
  categories: FeedCategory[],
  ref: FeedContainerRef,
  item: FeedItem,
  index: number
): FeedCategory[] {
  const category = categories.find((cat) => cat.title === ref.categoryTitle);
  if (!category) return categories;

  const items = getContainerItems(category, ref);
  const next = [...items];
  next.splice(index, 0, item);
  return updateCategoryItems(categories, ref, next);
}

export function moveCardInFeed(
  feed: ParsedFeed,
  activeCardId: string,
  overId: string
): ParsedFeed | null {
  const location = findFeedItem(feed, activeCardId);
  if (!location) return null;

  const source: FeedContainerRef = {
    categoryTitle: location.categoryTitle,
    subsectionTitle: location.subsectionTitle,
  };

  let target: FeedContainerRef;
  let targetIndex: number;

  if (isContainerEndId(overId)) {
    const parsed = parseContainerEndId(overId);
    if (!parsed) return null;

    target = parsed;
    const category = feed.categories.find((cat) => cat.title === target.categoryTitle);
    if (!category) return null;
    targetIndex = getContainerItems(category, target).length;
  } else if (isContainerId(overId)) {
    const parsed = parseContainerId(overId);
    if (!parsed) return null;

    target = parsed;
    const category = feed.categories.find((cat) => cat.title === target.categoryTitle);
    if (!category) return null;
    targetIndex = getContainerItems(category, target).length;
  } else {
    const overLocation = findFeedItem(feed, overId);
    if (!overLocation) return null;

    target = {
      categoryTitle: overLocation.categoryTitle,
      subsectionTitle: overLocation.subsectionTitle,
    };

    const category = feed.categories.find((cat) => cat.title === target.categoryTitle);
    if (!category) return null;

    const items = getContainerItems(category, target);
    targetIndex = items.findIndex((item) => item.id === overId);
    if (targetIndex === -1) return null;

    if (!sameContainer(source, target) && targetIndex === items.length - 1) {
      targetIndex = items.length;
    }
  }

  if (sameContainer(source, target)) {
    if (isContainerId(overId)) return null;

    const category = feed.categories.find((cat) => cat.title === source.categoryTitle);
    if (!category) return null;

    const items = getContainerItems(category, source);
    const oldIndex = items.findIndex((item) => item.id === activeCardId);
    const newIndex = items.findIndex((item) => item.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return null;

    return {
      ...feed,
      categories: updateCategoryItems(
        feed.categories,
        source,
        arrayMove(items, oldIndex, newIndex)
      ),
    };
  }

  const { categories: categoriesAfterRemove, item } = removeItemFromContainer(
    feed.categories,
    source,
    activeCardId
  );
  if (!item) return null;

  return {
    ...feed,
    categories: insertItemIntoContainer(
      categoriesAfterRemove,
      target,
      item,
      targetIndex
    ),
  };
}
