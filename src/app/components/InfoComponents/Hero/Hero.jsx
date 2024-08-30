import React from 'react'
import Image from 'next/image'
const Hero = ({item}) => {
  return (
      <div className="h-full w-full relative">
                <div className="absolute bg-black/30 top-0 left-0 w-full h-[30rem] text-white font-bold"></div>
                <Image
                    className="inset-0 h-[30rem] w-full object-cover object-top"
                    src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
                    alt={item.title || "Movie Image"}
                    width={240}
                    height={360}
                />
      </div>
  )
}

export default Hero
