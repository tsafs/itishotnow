import type { CSSProperties, ReactNode } from 'react';
import { theme } from '../../styles/design-system.js';

interface LinkProps {
    href: string;
    children: ReactNode;
    target?: string;
    rel?: string;
    color?: string;
    style?: CSSProperties;
}

const Link = ({
    href,
    children,
    target = '_blank',
    rel = 'noopener noreferrer',
    color = theme.colors.textLight,
    style = {}
}: LinkProps) => {
    const linkStyle: CSSProperties = {
        color,
        textDecoration: 'underline',
        ...style
    };

    return (
        <a
            href={href}
            target={target}
            rel={rel}
            style={linkStyle}
        >
            {children}
        </a>
    );
};

export default Link;
