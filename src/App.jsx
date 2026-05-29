import './App.css'
import Routing from './Routing/Routing'
import { Toaster } from 'react-hot-toast'

function App() {

    return (
      <>
        <Routing/>
        <Toaster position="top-right" />
      </>
  
  )
}

export default App
