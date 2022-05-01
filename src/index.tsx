import './styles/main.scss';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import reportWebVitals from './reportWebVitals';
// import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
// import Navigation from "./components/Navigation";
// import Footer from "./components/Footer";
// import Home from "./components/Home";
// import { Kamehameha } from './components/Kamehameha'

// ReactDOM.render(
// 	<React.StrictMode>
// 		<Router>
// 			<Navigation />
// 			<Routes>
// 				<Route path="/" element={<Home />} />
// 				{/* <Route path="/hci-project" element={<App />} /> */}
// 				<Route path="/kamehameha" element={<Kamehameha />} />
// 			</Routes>
// 			<Footer />
// 		</Router>
// 	</React.StrictMode>,

// 	document.getElementById("root")
// );

ReactDOM.render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
	document.getElementById('root')
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
