import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'
import Ticks from './components/Ticks'
import CenterHero from './components/CenterHero'
import CountBtn from './components/CountBtn'
import SocialIconList from './components/SocialIconList'

function App() {
  

  // let cnt = 0;

  // const addCounter = () => {
  //   console.log('addCounter');
  //   cnt += 1;
  //   console.log(cnt);
  // }

  return (
    <>
      <CenterHero />
      <Ticks />
      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <SocialIconList />
          <CountBtn />
        </div>
      </section>
      <Ticks />
      <section id="spacer">
        <CountBtn />
      </section>
    </>
  )
}

export default App
