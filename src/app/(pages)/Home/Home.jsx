import React from 'react'
import Hero from '@/app/components/Hero/Hero'
import TopRated from '@/app/components/TopRated/TopRated'
import Upcoming from '@/app/components/Upcoming/Upcoming'
const HomePage = () => {
  return (
    <div>
      <Hero />
      <TopRated />
      <Upcoming />
    </div>
  )
}

export default HomePage
