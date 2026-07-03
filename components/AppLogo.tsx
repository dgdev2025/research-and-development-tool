import Image from "next/image";
import Link from "next/link";

interface AppLogoProps {
  href?: string;
}

export function AppLogo({ href }: AppLogoProps) {
  const content = (
    <div className="app-logo">
      <Image
        src="https://digitalgoliath.com.au/wp-content/uploads/2025/10/Logo.svg"
        alt="Digital Goliath"
        width={150}
        height={36}
        priority
      />
      <span className="app-logo-tagline">Research and Development</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="app-logo-link">
        {content}
      </Link>
    );
  }

  return content;
}
