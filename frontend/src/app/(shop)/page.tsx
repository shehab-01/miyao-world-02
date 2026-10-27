import HeroSlider from "@/components/home/HeroSlider";
import ProductCard from "@/components/product/ProductCard";
import { featuredProducts, heroSlides } from "@/lib/site-config";

export default function Home() {
  return (
    <>
      <HeroSlider slides={heroSlides} />
      <div className="mt-[30px] grid grid-cols-1 gap-[30px] sm:grid-cols-2">
        {featuredProducts.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </>
  );
}
