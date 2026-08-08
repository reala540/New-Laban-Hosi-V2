import { ContentProvider } from './lib/ContentContext'
import { useScrollReveal } from './lib/useScrollReveal'
import Header from './components/Header'
import Banner from './components/Banner'
import Hero from './components/Hero'
import PhotoShowcase from './components/PhotoShowcase'
import About from './components/About'
import Credibility from './components/Credibility'
import Services from './components/Services'
import Offers from './components/Offers'
import Doctors from './components/Doctors'
import Appointment from './components/Appointment'
import Contact from './components/Contact'
import Footer from './components/Footer'
import FloatingActions from './components/FloatingActions'

function App() {
  useScrollReveal()

  return (
    <ContentProvider>
      <div className="app">
        <Banner />
        <Header />
        <Hero />
        <PhotoShowcase />
        <About />
        <Credibility />
        <Services />
        <Offers />
        <Doctors />
        <Appointment />
        <Contact />
        <Footer />
        <FloatingActions />
      </div>
    </ContentProvider>
  )
}

export default App
