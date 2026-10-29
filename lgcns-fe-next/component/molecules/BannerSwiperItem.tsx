import Image from "next/image";

export default function BannerSwiperItem() {
    return (
        <div id="swiper-item">
            <Image 
                src={"https://i.pinimg.com/1200x/49/9b/65/499b651238e31591d4f0f15bd36042bf.jpg"}
                alt="cat banner"
                width={1000}
                height={1000}
            />
            <h3>Cat Banner</h3>
            <p>Cat Banner Description</p>
            <button>View More</button>
        </div>
    );
}