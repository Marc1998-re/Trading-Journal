import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

const ScrollToTop = () => {
    const { pathname, hash, key } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [pathname]);

    useLayoutEffect(() => {
        if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    }, [pathname, hash, key]);

    return null;
}

export default ScrollToTop;
