import { Link } from 'react-router-dom';
import { PAGE_NAME } from '../../constants/page';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-links">
                    <Link to="/" className="footer-link">Home</Link>
                    <Link to="/impressum" className="footer-link">Impressum</Link>
                    {/* Add more links here as needed */}
                </div>
                <div className="footer-copyright">
                    © {currentYear} {PAGE_NAME}
                </div>
            </div>
        </footer>
    );
};

export default Footer;
