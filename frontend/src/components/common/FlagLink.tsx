import type { CSSProperties } from 'react';
import './FlagLink.css';

interface FlagLinkProps {
    url: string;
    flagImage?: string;
    title: string;
    customStyle?: CSSProperties;
}

const FlagLink = ({ url, flagImage, title, customStyle }: FlagLinkProps) => {
    const flagStyle: CSSProperties | undefined = customStyle ?? (
        flagImage
            ? {
                backgroundImage: `url("${flagImage}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }
            : undefined
    );

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flag-link">
            <div className="flag">
                <div
                    className="flag-image"
                    style={flagStyle}
                ></div>
            </div>
            <span className="flag-title">{title}</span>
        </a>
    );
};

export default FlagLink;
