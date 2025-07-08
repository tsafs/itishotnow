import React from 'react';
import './FlagLink.css';

const FlagLink = ({ url, flagImage, title, customStyle }) => {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flag-link">
            <div className="flag">
                <div
                    className="flag-image"
                    style={customStyle || {
                        backgroundImage: `url("${flagImage}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                ></div>
            </div>
            <span className="flag-title">{title}</span>
        </a>
    );
};

export default FlagLink;
