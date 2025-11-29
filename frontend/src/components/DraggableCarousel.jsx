import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function DraggableCarousel({ children, itemMinWidth = 300, gap = 16 }) {
    const scrollContainerRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [velocity, setVelocity] = useState(0);
    const [lastX, setLastX] = useState(0);
    const [lastTime, setLastTime] = useState(0);

    useEffect(() => {
        setTotalItems(React.Children.count(children));
    }, [children]);

    // Momentum scrolling effect
    useEffect(() => {
        if (!isDragging && Math.abs(velocity) > 0.5) {
            const momentum = setInterval(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollLeft += velocity;
                    setVelocity(v => v * 0.95); // Friction

                    if (Math.abs(velocity) < 0.5) {
                        clearInterval(momentum);
                        setVelocity(0);
                    }
                }
            }, 16);

            return () => clearInterval(momentum);
        }
    }, [isDragging, velocity]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setLastX(e.pageX);
        setLastTime(Date.now());
        setVelocity(0);
        scrollContainerRef.current.style.cursor = 'grabbing';
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setLastX(e.touches[0].pageX);
        setLastTime(Date.now());
        setVelocity(0);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;

        // Calculate velocity for momentum
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) {
            const dx = e.pageX - lastX;
            setVelocity(-dx / dt * 16);
        }
        setLastX(e.pageX);
        setLastTime(now);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;

        // Calculate velocity for momentum
        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 0) {
            const dx = e.touches[0].pageX - lastX;
            setVelocity(-dx / dt * 16);
        }
        setLastX(e.touches[0].pageX);
        setLastTime(now);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.style.cursor = 'grab';
        }
    };

    const handleScroll = () => {
        if (scrollContainerRef.current && !isDragging) {
            const container = scrollContainerRef.current;
            const scrollPosition = container.scrollLeft;
            const itemWidth = itemMinWidth + gap;
            const index = Math.round(scrollPosition / itemWidth);
            setCurrentIndex(index);
        }
    };

    const scrollToIndex = (index) => {
        if (scrollContainerRef.current) {
            const itemWidth = itemMinWidth + gap;
            const targetScroll = index * itemWidth;

            // Smooth whoosh animation
            const start = scrollContainerRef.current.scrollLeft;
            const distance = targetScroll - start;
            const duration = 600; // ms
            let startTime = null;

            const easeInOutCubic = (t) => {
                return t < 0.5
                    ? 4 * t * t * t
                    : 1 - Math.pow(-2 * t + 2, 3) / 2;
            };

            const animate = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = easeInOutCubic(progress);

                scrollContainerRef.current.scrollLeft = start + (distance * eased);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    };

    const scrollPrev = () => {
        if (currentIndex > 0) {
            scrollToIndex(currentIndex - 1);
        }
    };

    const scrollNext = () => {
        if (currentIndex < totalItems - 1) {
            scrollToIndex(currentIndex + 1);
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', overflow: 'visible', padding: '0 48px' }}>
            {/* Scroll Container */}
            <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleDragEnd}
                onScroll={handleScroll}
                style={{
                    display: 'flex',
                    gap: `${gap}px`,
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    cursor: 'grab',
                    userSelect: 'none',
                    padding: '8px 0',
                    scrollBehavior: isDragging ? 'auto' : 'smooth',
                }}
                className="draggable-carousel"
            >
                {React.Children.map(children, (child, index) => (
                    <div
                        key={index}
                        style={{
                            minWidth: `${itemMinWidth}px`,
                            maxWidth: `${itemMinWidth}px`,
                            flexShrink: 0,
                            transition: 'transform 0.3s ease',
                            transform: index === currentIndex ? 'scale(1)' : 'scale(0.98)',
                        }}
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Navigation Arrows - Redesigned */}
            {currentIndex > 0 && (
                <button
                    onClick={scrollPrev}
                    style={{
                        position: 'absolute',
                        left: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'linear-gradient(135deg, #E20074 0%, #C0005F 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        boxShadow: '0 4px 20px rgba(226, 0, 116, 0.4)',
                        zIndex: 10,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) translateX(-4px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(226, 0, 116, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) translateX(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(226, 0, 116, 0.4)';
                    }}
                    aria-label="Previous"
                >
                    <ChevronLeft size={28} strokeWidth={2.5} />
                </button>
            )}

            {currentIndex < totalItems - 1 && (
                <button
                    onClick={scrollNext}
                    style={{
                        position: 'absolute',
                        right: '0',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'linear-gradient(135deg, #E20074 0%, #C0005F 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        boxShadow: '0 4px 20px rgba(226, 0, 116, 0.4)',
                        zIndex: 10,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backdropFilter: 'blur(10px)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) translateX(4px) scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(226, 0, 116, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(-50%) translateX(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(226, 0, 116, 0.4)';
                    }}
                    aria-label="Next"
                >
                    <ChevronRight size={28} strokeWidth={2.5} />
                </button>
            )}

            {/* Dot Indicators - Enhanced */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '20px',
            }}>
                {Array.from({ length: totalItems }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollToIndex(index)}
                        style={{
                            width: currentIndex === index ? '32px' : '10px',
                            height: '10px',
                            borderRadius: '5px',
                            border: 'none',
                            background: currentIndex === index
                                ? 'linear-gradient(90deg, #E20074 0%, #C0005F 100%)'
                                : 'rgba(226, 0, 116, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: currentIndex === index ? '0 2px 8px rgba(226, 0, 116, 0.3)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                            if (currentIndex !== index) {
                                e.currentTarget.style.background = 'rgba(226, 0, 116, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentIndex !== index) {
                                e.currentTarget.style.background = 'rgba(226, 0, 116, 0.2)';
                            }
                        }}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>

            {/* Drag Hint with animation */}
            <div style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '13px',
                opacity: 0.5,
                fontStyle: 'italic',
                animation: 'fadeInOut 3s ease-in-out infinite',
                color: '#E20074',
                fontWeight: 500,
            }}>
                ← Drag to explore →
            </div>
        </div>
    );
}

export default DraggableCarousel;
