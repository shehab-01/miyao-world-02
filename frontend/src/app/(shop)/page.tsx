import HeroSlider from "@/components/home/HeroSlider";
import CategorySection from "@/components/home/CategorySection";
import { getHomeSections } from "@/lib/catalog";
import { heroSlides } from "@/lib/site-config";

export default async function Home() {
  const sections = await getHomeSections();

  return (
    <>
      <HeroSlider slides={heroSlides} />
      {sections.map((section) => (
        <CategorySection key={section.category.slug} section={section} />
      ))}
    </>
  );
}
