import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './ImpressumPage.css';

const ImpressumPage = () => {
    const [markdownContent, setMarkdownContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the impressum content from the public folder
        fetch('/impressum.md')
            .then(response => response.text())
            .then(data => {
                setMarkdownContent(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading impressum:', error);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div className="impressum-loading">Loading...</div>;
    }

    return (
        <div className="impressum-container">
            <div className="impressum-content">
                <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
        </div>
    );
};

export default ImpressumPage;
