import { NavLink } from "react-router-dom";

const Navigation = () => {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <NavLink className="navbar-brand" to="/">
            Home
          </NavLink>
          <div>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item h6">
                <NavLink className="nav-link" to="/hci-project">
                  HCI Gesture Recognition Project
                </NavLink>
              </li>
              <li className="nav-item h6">
                <NavLink className="nav-link" to="/kamehameha">
                  Kamehameha
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navigation;