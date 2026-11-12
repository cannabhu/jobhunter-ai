import Image from "next/image";

type FeatureItem = {
  title: string;
  description: string;
};

type Props = {
  heading: string;
  items: FeatureItem[];
  activeIndex: number;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imageSide: "left" | "right";
};

export function FeatureSplit({
  heading,
  items,
  activeIndex,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  imageSide,
}: Props) {
  const imageFirst = imageSide === "left";

  return (
    <section className="grid border-b border-border md:grid-cols-2">
      <div className={`flex items-center justify-center bg-surface-muted px-8 py-12 ${imageFirst ? "md:order-1" : "md:order-2"}`}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          sizes="(max-width: 768px) 100vw, 500px"
          className="h-auto w-full max-w-[500px]"
        />
      </div>
      <div className={`flex flex-col bg-surface ${imageFirst ? "md:order-2" : "md:order-1"}`}>
        <h2 className="border-b border-border px-10 py-12 text-3xl font-semibold leading-tight tracking-tight text-text-slate">
          {heading}
        </h2>
        {items.map((item, index) => (
          <div
            key={item.title}
            className={`border-b border-border px-10 py-6 last:border-b-0 ${index === activeIndex ? "border-l-2 border-l-accent" : ""}`}
          >
            <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
            <p className="mt-2 text-xs leading-5 text-text-secondary">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
