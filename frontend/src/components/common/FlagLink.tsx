import type { CSSProperties } from 'react';
import { createStyles } from '../../styles/design-system.js';

interface FlagLinkProps {
    url: string;
    flagImage?: string;
    title: string;
    customStyle?: CSSProperties;
}

const styles = createStyles({
    link: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s ease',
    },
    flag: {
        width: 60,
        height: 40,
        marginBottom: '0.5rem',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    },
    title: {
        fontSize: '0.9rem',
    },
});

const FlagLink = ({ url, flagImage, title, customStyle }: FlagLinkProps) => {
    const flagStyle: CSSProperties | undefined = flagImage
        ? {
            ...styles.flag,
            backgroundImage: `url("${flagImage}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            ...customStyle
        }
        :
        {
            ...styles.flag,
            ...customStyle
        };

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
            <div style={flagStyle} />
            <span style={styles.title}>{title}</span>
        </a>
    );
};

export default FlagLink;
