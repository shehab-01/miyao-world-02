"""Fill the local database with a demo catalog (categories + products with photos).

Run inside the backend container:
    docker compose exec backend python -m app.seed           # only if there are no products yet
    docker compose exec backend python -m app.seed --reset   # delete all products first

Photos are free-licence stand-ins from Unsplash (https://unsplash.com/license),
downloaded at seed time. Replace them with real product shots in /admin/products.
"""

import asyncio
import sys

import httpx
from sqlalchemy import delete, func, select

from app.db import AsyncSessionLocal
from app.models import Category, Product, ProductImage, ProductVariant
from app.uploads import image_extension, store_image

CATEGORIES = [
    ("t-shirts", "T-Shirts"),
    ("sweatshirts", "Sweatshirts"),
    ("hoodie", "Hoodie"),
    ("bottoms", "Bottoms"),
    ("outers", "Outers"),
    ("acc", "Acc"),
]

TOP_SIZES = ["S", "M", "L"]
TOP_GUIDE = [
    {"title": "[S Size]", "lines": ["Length 68cm / Shoulder 50cm", "Chest 56cm / Sleeve 21cm"]},
    {"title": "[M Size]", "lines": ["Length 70cm / Shoulder 52cm", "Chest 58cm / Sleeve 22cm"]},
    {"title": "[L Size]", "lines": ["Length 72cm / Shoulder 54cm", "Chest 60cm / Sleeve 23cm"]},
]
SWEAT_GUIDE = [
    {"title": "[S Size]", "lines": ["Length 66cm / Shoulder 55cm", "Chest 60cm / Sleeve 58cm"]},
    {"title": "[M Size]", "lines": ["Length 68cm / Shoulder 57cm", "Chest 62cm / Sleeve 59cm"]},
    {"title": "[L Size]", "lines": ["Length 70cm / Shoulder 59cm", "Chest 64cm / Sleeve 60cm"]},
]
OUTER_GUIDE = [
    {"title": "[M Size]", "lines": ["Length 66cm / Shoulder 50cm", "Chest 59cm / Sleeve 62cm"]},
    {"title": "[L Size]", "lines": ["Length 68cm / Shoulder 52cm", "Chest 61cm / Sleeve 63cm"]},
]
DENIM_SIZES = ["28", "30", "32", "34"]
DENIM_GUIDE = [
    {"title": "[28]", "lines": ["Waist 36cm / Hip 48cm", "Thigh 30cm / Length 102cm"]},
    {"title": "[30]", "lines": ["Waist 39cm / Hip 50cm", "Thigh 31cm / Length 103cm"]},
    {"title": "[32]", "lines": ["Waist 41cm / Hip 52cm", "Thigh 32cm / Length 104cm"]},
    {"title": "[34]", "lines": ["Waist 44cm / Hip 54cm", "Thigh 33cm / Length 105cm"]},
]

# (category, slug, name, price, sale_price, material, note, sizes, colors, size_guide, photo ids)
PRODUCTS = [
    ("t-shirts", "miyao-cat-graphic-tee", "MIYAO CAT GRAPHIC TEE", 39000, None,
     "Cotton 100%", "미야오 월드의 고양이 그래픽을 담은 반팔 티셔츠입니다.\n두께감 있는 20수 코튼으로 한 장만 입어도 비치지 않습니다.",
     TOP_SIZES, ["Cream"], TOP_GUIDE, ["1576566588028-4147f3842f27"]),
    ("t-shirts", "essential-crew-tee", "ESSENTIAL CREW TEE (WHITE)", 29000, 25000,
     "Cotton 100%", "매일 입기 좋은 기본 크루넥 티셔츠.\n세탁 후에도 목 늘어남이 적도록 바인딩을 보강했습니다.",
     TOP_SIZES, [], TOP_GUIDE, ["1581655353564-df123a1eb820"]),
    ("t-shirts", "pocket-tee-teal", "POCKET TEE (TEAL)", 32000, None,
     "Cotton 100%", "가슴 포켓 디테일의 피그먼트 다잉 티셔츠.\n입을수록 자연스러운 빈티지 컬러로 변합니다.",
     TOP_SIZES, [], TOP_GUIDE, ["1633966887768-64f9a867bdba"]),
    ("t-shirts", "long-sleeve-tee-black", "LONG SLEEVE TEE (BLACK)", 35000, None,
     "Cotton 95% Span 5", "레이어드하기 좋은 슬림핏 긴팔 티셔츠.",
     TOP_SIZES, [], TOP_GUIDE, ["1618354691551-44de113f0164"]),

    ("sweatshirts", "daily-crewneck-white", "DAILY CREWNECK (WHITE)", 49000, None,
     "Cotton 80% Polyester 20%", "부드러운 기모 안감의 크루넥 스웨트셔츠.\n데님과 가장 잘 어울리는 화이트 컬러입니다.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1620799140408-edc6dcb6d633"]),
    ("sweatshirts", "heavyweight-sweatshirt-black", "HEAVYWEIGHT SWEATSHIRT (BLACK)", 55000, None,
     "Cotton 100%", "500g 헤비웨이트 원단으로 탄탄하게 떨어지는 실루엣.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1499971856191-1a420a42b498"]),
    ("sweatshirts", "crewneck-sweatshirt-orange", "CREWNECK SWEATSHIRT (ORANGE)", 52000, 45000,
     "Cotton 80% Polyester 20%", "포인트 컬러로 입기 좋은 오렌지 스웨트셔츠.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1578587018452-892bacefd3f2"]),
    ("sweatshirts", "crewneck-sweatshirt-navy", "CREWNECK SWEATSHIRT (NAVY)", 52000, None,
     "Cotton 80% Polyester 20%", "가슴 작은 자수 로고의 네이비 스웨트셔츠.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1614975059251-992f11792b9f"]),

    ("hoodie", "cloud-hoodie-white", "CLOUD HOODIE (WHITE)", 59000, None,
     "Cotton 80% Polyester 20%", "구름처럼 가볍고 포근한 기모 후드.\n넉넉한 후드 볼륨과 캥거루 포켓.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1620799140188-3b2a02fd9a77"]),
    ("hoodie", "pullover-hoodie-grey", "PULLOVER HOODIE (MELANGE GREY)", 59000, None,
     "Cotton 80% Polyester 20%", "사계절 기본템, 멜란지 그레이 후드.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1556821840-3a63f95609a7"]),
    ("hoodie", "pullover-hoodie-brown", "PULLOVER HOODIE (BROWN)", 62000, 55000,
     "Cotton 80% Polyester 20%", "차분한 브라운 컬러의 오버핏 후드.",
     TOP_SIZES, [], SWEAT_GUIDE, ["1578768079052-aa76e52ff62e"]),

    ("bottoms", "washed-straight-denim", "WASHED STRAIGHT DENIM", 69000, None,
     "Cotton 100%", "자연스러운 워싱의 스트레이트 데님.\n허리부터 밑단까지 일자로 떨어지는 핏입니다.",
     DENIM_SIZES, [], DENIM_GUIDE, ["1624378439575-d8705ad7ae80", "1624378441864-6eda7eac51cb"]),
    ("bottoms", "black-selvedge-jeans", "BLACK SELVEDGE JEANS", 75000, None,
     "Cotton 100%", "셀비지 원단의 블랙 데님. 밑단을 롤업했을 때 셀비지 라인이 보입니다.",
     DENIM_SIZES, [], DENIM_GUIDE, ["1718252540617-6ecda2b56b57"]),
    ("bottoms", "wide-pants-brick", "WIDE PANTS (BRICK)", 58000, None,
     "Polyester 70% Rayon 30%", "찰랑이는 드레이프가 예쁜 와이드 팬츠. 허리 밴딩으로 편안합니다.",
     TOP_SIZES, [], [], ["1590159983013-d4ff5fc71c1d"]),

    ("outers", "bomber-jacket-rust", "BOMBER JACKET (RUST)", 129000, 109000,
     "Nylon 100% / Lining Polyester 100%", "가벼운 나일론 소재의 MA-1 봄버 재킷.",
     ["M", "L"], [], OUTER_GUIDE, ["1591047139829-d91aecb6caea"]),
    ("outers", "corduroy-collar-denim-jacket", "CORDUROY COLLAR DENIM JACKET", 119000, None,
     "Cotton 100%", "코듀로이 카라 포인트의 트러커 데님 재킷.",
     ["M", "L"], [], OUTER_GUIDE, ["1611312449408-fcece27cdbb7"]),
    ("outers", "leather-rider-jacket", "LEATHER RIDER JACKET", 239000, None,
     "Lamb Leather 100%", "부드러운 램스킨 라이더 재킷. 입을수록 몸에 맞게 길듭니다.",
     ["M", "L"], [], OUTER_GUIDE, ["1551028719-00167b16eac5"]),

    ("acc", "washed-ball-cap-charcoal", "WASHED BALL CAP (CHARCOAL)", 32000, None,
     "Cotton 100%", "빈티지 워싱 볼캡. 뒷면 스트랩으로 사이즈 조절이 가능합니다.",
     [], [], [], ["1521369909029-2afed882baee"]),
    ("acc", "mesh-trucker-cap-white", "MESH TRUCKER CAP (WHITE)", 29000, None,
     "Polyester 100%", "통기성 좋은 메쉬 트러커 캡.",
     [], [], [], ["1588850561407-ed78c282e89b"]),
    ("acc", "canvas-tote-bag", "CANVAS TOTE BAG", 25000, None,
     "Cotton Canvas 100%", "A4 서류와 노트북이 들어가는 넉넉한 캔버스 에코백.",
     [], [], [], ["1574365569389-a10d488ca3fb"]),
]


async def download(client: httpx.AsyncClient, photo_id: str) -> dict:
    response = await client.get(
        f"https://images.unsplash.com/photo-{photo_id}",
        params={"w": 1200, "q": 75, "fm": "jpg", "fit": "max"},
    )
    response.raise_for_status()
    extension = image_extension(response.content)
    if extension is None:
        raise ValueError(f"photo {photo_id} is not an image")
    return store_image(response.content, extension)


def variants_for(sizes: list[str], colors: list[str]) -> list[ProductVariant]:
    combos = [(s, c) for c in (colors or [None]) for s in (sizes or [None])]
    return [
        ProductVariant(size=size, color=color, stock=20, sort_order=i)
        for i, (size, color) in enumerate(combos)
    ]


async def seed(reset: bool) -> None:
    async with AsyncSessionLocal() as db:
        if reset:
            await db.execute(delete(Product))
        elif await db.scalar(select(func.count()).select_from(Product)):
            print("Products already exist — skipping. Use --reset to replace them.")
            return

        categories = {c.slug: c for c in await db.scalars(select(Category))}
        for order, (slug, name) in enumerate(CATEGORIES):
            if slug not in categories:
                categories[slug] = Category(slug=slug, name=name, sort_order=order)
                db.add(categories[slug])

        async with httpx.AsyncClient(timeout=30) as client:
            for index, row in enumerate(PRODUCTS):
                category, slug, name, price, sale, material, note, sizes, colors, guide, photos = row
                stored = [await download(client, photo) for photo in photos]
                db.add(
                    Product(
                        category=categories[category],
                        slug=slug,
                        name=name,
                        price=price,
                        sale_price=sale,
                        material=material,
                        note=note,
                        size_guide=guide,
                        sort_order=index,
                        images=[ProductImage(**image, sort_order=i) for i, image in enumerate(stored)],
                        variants=variants_for(sizes, colors),
                    )
                )
                print(f"  {name} ({len(stored)} photo{'s' if len(stored) > 1 else ''})")

        await db.commit()
        print(f"Seeded {len(PRODUCTS)} products in {len(CATEGORIES)} categories.")


if __name__ == "__main__":
    asyncio.run(seed(reset="--reset" in sys.argv))
