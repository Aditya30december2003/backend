"use client"
import React, { useEffect, useState } from 'react'
import requests from '@/app/helpers/Requests';
import MovieBlock from '../MovieBlock/MovieBlock';
import Link from 'next/link';

const Upcoming = () => {
    
    const [items , setItems] = useState([]);
    const [page , setPage] = useState(1);
    const getData = async()=>{
      let AllItems =[]
      let page=1
      while(AllItems.length<100){
        const response = await fetch(`${requests.requestUpcoming}&page=${page}`)
        const data =await response.json()
        console.log(data.results)
        AllItems = [...AllItems , ...data.results]
        page++;
      }

      setItems(AllItems.slice(0,100))
    }

    //pagination
    let ItemsPerPage =20;
    let firstIndex = (page-1)*ItemsPerPage
    let lastIndex =page*ItemsPerPage
    let AllPages=[]
    let NumberofPages = items.length / ItemsPerPage;

    for(let i=0;i<NumberofPages;i++){
      AllPages.push(i+1);
    }

    let currentItems = items.slice(firstIndex , lastIndex);



    useEffect(()=>{
        getData()
    },[])


  return (
    <div>
      <h1 className='text-white font-bold text-center'>Upcoming</h1>
      <div className='grid grid-cols-5 mx-auto w-[80%] gap-4'>
                {currentItems.map((item, index) => (
                   <MovieBlock item={item} key={index} /> 
                ))}
      </div>

      <div className='flex items-center font-bold text-white mx-auto w-[25%] mb-10 mt-10 gap-5'>
        {AllPages.map((page , index)=>(
          <>
          <div key={index}>
           <button onClick={()=>setPage(page)} className='border-2 border-white px-4 py-3 cursor-pointer'>{page}</button>
          </div>
          </>
        ))}
      </div>
    </div>
  )
}

export default Upcoming
