import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Help from './Help/Help'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <Help/>
    </>
  )
}

export default App
