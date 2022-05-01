import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navigation from "./Navigation";
import Footer from "./Footer";
import Home from "./Home";
import { Kamehameha } from './Kamehameha'
import { HCIProject } from './HCIProject'

const App = () => {
    return (
        <Router>
            <Navigation />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/hci-project" element={<HCIProject />} />
                <Route path="/kamehameha" element={<Kamehameha />} />
            </Routes>
            <Footer />
        </Router>
    );
}

export default App;