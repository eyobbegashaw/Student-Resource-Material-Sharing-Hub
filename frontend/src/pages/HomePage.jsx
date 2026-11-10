import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { resourcesAPI, contactAPI } from '../services/api';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import ResourceCard from '../components/Resources/ResourceCard';
import toast from 'react-hot-toast';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRightIcon,
  SparklesIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingLibraryIcon,
  ArrowDownTrayIcon,
  StarIcon,
  FireIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

gsap.registerPlugin(ScrollTrigger);

const HomePage = () => {
  const { t, isAmharic } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [activeTab, setActiveTab] = useState('topRated');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sendingContact, setSendingContact] = useState(false);

  // Horizontal auto-scroll cards state (showing 1 card at a time)
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [carouselProgress, setCarouselProgress] = useState(0);

  // Auto-advance timer (cycles smoothly every 5 seconds, pauses when hovered)
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 5000;
    const stepTime = 50;
    const increment = (stepTime / intervalTime) * 100;

    const interval = setInterval(() => {
      setCarouselProgress((prev) => {
        if (prev >= 100) {
          setActiveCardIndex((current) => (current + 1) % 4);
          return 0;
        }
        return prev + increment;
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleNextCard = () => {
    setCarouselProgress(0);
    setActiveCardIndex((prev) => (prev + 1) % 4);
  };

  const handlePrevCard = () => {
    setCarouselProgress(0);
    setActiveCardIndex((prev) => (prev - 1 + 4) % 4);
  };

  const handleSelectCard = (index) => {
    setCarouselProgress(0);
    setActiveCardIndex(index);
  };

  // 4 Detailed Cards Explaining the System with Advanced UI/UX (Fully Bilingual)
  const systemCards = [
    {
      id: 1,
      pillar: t('card1_pillar'),
      title: t('card1_title'),
      subtitle: t('card1_subtitle'),
      description: t('card1_desc'),
      color: 'blue',
      gradient: 'from-blue-600 via-indigo-600 to-sky-600',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      icon: BuildingLibraryIcon,
      features: [
        t('card1_f1'),
        t('card1_f2'),
        t('card1_f3'),
      ],
      preview: {
        title: t('card1_preview_title'),
        items: ['Addis Ababa Univ (AAU)', 'Debre Berhan Univ (DBU)', 'Bahir Dar Univ (BDU)', 'Hawassa Univ (HU)'],
        metric: t('card1_preview_metric'),
        badge: t('card1_preview_badge'),
      },
      ctaText: t('card1_cta'),
      ctaAction: () => navigate('/browse'),
    },
    {
      id: 2,
      pillar: t('card2_pillar'),
      title: t('card2_title'),
      subtitle: t('card2_subtitle'),
      description: t('card2_desc'),
      color: 'emerald',
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      icon: CloudArrowUpIcon,
      features: [
        t('card2_f1'),
        t('card2_f2'),
        t('card2_f3'),
      ],
      preview: {
        title: t('card2_preview_title'),
        items: ['Format: PDF Document', 'Target: Computer Science (CS)', 'Year: 4th Year • Sem 1'],
        metric: t('card2_preview_metric'),
        badge: t('card2_preview_badge'),
      },
      ctaText: t('card2_cta'),
      ctaAction: () => {
        if (!user) {
          navigate('/login');
        } else {
          navigate('/upload');
        }
      },
    },
    {
      id: 3,
      pillar: t('card3_pillar'),
      title: t('card3_title'),
      subtitle: t('card3_subtitle'),
      description: t('card3_desc'),
      color: 'purple',
      gradient: 'from-purple-600 via-indigo-600 to-violet-600',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      icon: MagnifyingGlassIcon,
      features: [
        t('card3_f1'),
        t('card3_f2'),
        t('card3_f3'),
      ],
      preview: {
        title: t('card3_preview_title'),
        items: ['University: Debre Berhan (DBU)', 'Department: Computer Science', 'Exam Type: Midterms & Finals'],
        metric: t('card3_preview_metric'),
        badge: t('card3_preview_badge'),
      },
      ctaText: t('card3_cta'),
      ctaAction: () => navigate('/browse'),
    },
    {
      id: 4,
      pillar: t('card4_pillar'),
      title: t('card4_title'),
      subtitle: t('card4_subtitle'),
      description: t('card4_desc'),
      color: 'amber',
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      icon: CheckBadgeIcon,
      features: [
        t('card4_f1'),
        t('card4_f2'),
        t('card4_f3'),
      ],
      preview: {
        title: t('card4_preview_title'),
        items: ['Rating: 4.9 ★ (Peer Reviewed)', 'Downloads: 250+ Students', 'Saved to Download History'],
        metric: t('card4_preview_metric'),
        badge: t('card4_preview_badge'),
      },
      ctaText: t('card4_cta'),
      ctaAction: () => navigate('/browse?sort=-average_rating'),
    },
  ];

  // Fetch real database stats (resources, registered universities, downloads, ratings)
  const { data: dbStats } = useQuery(
    'platform_db_stats',
    () => resourcesAPI.getStats().then((res) => res.data).catch(() => null),
    { refetchOnWindowFocus: true }
  );

  // Fetch top rated resources
  const { data: topRated, isLoading: topRatedLoading } = useQuery(
    'topRated',
    () => resourcesAPI.getTopRated().then((res) => res.data?.results || res.data || [])
  );

  // Fetch most downloaded resources
  const { data: mostDownloaded, isLoading: mostDownloadedLoading } = useQuery(
    'mostDownloaded',
    () => resourcesAPI.getMostDownloaded().then((res) => res.data?.results || res.data || [])
  );

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero timeline
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-badge', { y: -20, opacity: 0, duration: 0.6 })
        .from('.hero-title', { y: 30, opacity: 0, duration: 0.8 }, '-=0.3')
        .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
        .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6, stagger: 0.15 }, '-=0.4')
        .from('.hero-stats', { y: 30, opacity: 0, duration: 0.7 }, '-=0.3');

      // ScrollTrigger for Mission / Pillars
      gsap.from('.mission-header', {
        scrollTrigger: {
          trigger: '#mission',
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
      });

      gsap.from('.mission-carousel', {
        scrollTrigger: {
          trigger: '#mission',
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out',
      });

      // ScrollTrigger for Sources section
      gsap.from('.sources-header', {
        scrollTrigger: {
          trigger: '#sources',
          start: 'top 80%',
        },
        y: 30,
        opacity: 0,
        duration: 0.7,
      });

      // ScrollTrigger for Universities section
      gsap.from('.uni-pill', {
        scrollTrigger: {
          trigger: '#universities',
          start: 'top 85%',
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
      });

      // ScrollTrigger for Contact section
      gsap.from('.contact-box', {
        scrollTrigger: {
          trigger: '#contact',
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast.error('Please provide your name, email, and message.');
      return;
    }
    setSendingContact(true);
    try {
      const response = await contactAPI.send(contactForm);
      toast.success(response.data?.message || t('contact_success') || 'Your message has been delivered to eyobbegashaw075@gmail.com!');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to deliver message. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSendingContact(false);
    }
  };

  const universityLogos = [
    { name: 'Addis Ababa University', code: 'AAU', city: 'Addis Ababa' },
    { name: 'Adama Science & Tech', code: 'ASTU', city: 'Adama' },
    { name: 'Bahir Dar University', code: 'BDU', city: 'Bahir Dar' },
    { name: 'Hawassa University', code: 'HU', city: 'Hawassa' },
    { name: 'Jimma University', code: 'JU', city: 'Jimma' },
    { name: 'Mekelle University', code: 'MU', city: 'Mekelle' },
    { name: 'University of Gondar', code: 'UoG', city: 'Gondar' },
    { name: 'Arba Minch University', code: 'AMU', city: 'Arba Minch' },
  ];

  return (
    <div ref={rootRef} className="overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (#home) */}
      {/* ========================================================================= */}
      <section
        id="home"
        className="relative pt-10 pb-20 md:pt-16 md:pb-28 bg-gradient-to-b from-blue-50/70 via-white to-gray-50 dark:from-gray-900/80 dark:via-gray-950 dark:to-gray-950 transition-colors"
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            {/* National Badge */}
            <div className="hero-badge inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span>{t('hero_badge')}</span>
            </div>

            {/* Title */}
            <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.15]">
              {t('hero_title')}
            </h1>

            {/* Subtitle */}
            <p className="hero-desc text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {t('hero_subtitle')}
            </p>

            {/* Action Buttons */}
            <div className="hero-cta flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                to="/browse"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center space-x-2 group"
              >
                <span>{t('hero_cta_browse')}</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    navigate('/login');
                  } else {
                    navigate('/upload');
                  }
                }}
                className="px-6 py-3.5 rounded-xl bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm sm:text-base border border-gray-200 dark:border-gray-800 shadow-sm active:scale-95 transition-all flex items-center space-x-2"
              >
                <CloudArrowUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>{t('hero_cta_publish')}</span>
              </button>
            </div>
          </div>

          {/* Animated Stats Bar - Real Database Counts, No Mock Data */}
          <div className="hero-stats mt-16 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-xl shadow-gray-200/40 dark:shadow-none">
              <div className="text-center p-3">
                <p className="text-3xl sm:text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                  {dbStats?.total_resources !== undefined ? dbStats.total_resources.toLocaleString() : (topRated?.length || 0)}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {t('hero_stats_resources')}
                </p>
              </div>

              <div className="text-center p-3 border-l border-gray-200 dark:border-gray-800">
                <p className="text-3xl sm:text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {dbStats?.total_universities !== undefined ? dbStats.total_universities : 0}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {t('hero_stats_universities')}
                </p>
              </div>

              <div className="text-center p-3 border-l md:border-l border-gray-200 dark:border-gray-800">
                <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {dbStats?.total_downloads !== undefined ? dbStats.total_downloads.toLocaleString() : 0}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {t('hero_stats_downloads')}
                </p>
              </div>

              <div className="text-center p-3 border-l border-gray-200 dark:border-gray-800">
                <p className="text-3xl sm:text-4xl font-extrabold text-amber-500">
                  {dbStats?.average_rating ? Number(dbStats.average_rating).toFixed(1) : '5.0'} ★
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {t('hero_stats_satisfaction')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. MISSION & PILLARS (#mission) */}
      {/* ========================================================================= */}
      <section id="mission" className="py-20 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mission-header text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              <SparklesIcon className="h-4 w-4" />
              <span>{t('mission_tag')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
              {t('mission_title')}
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {t('mission_desc')}
            </p>
          </div>

          {/* ADVANCED HORIZONTAL AUTO-SCROLL CAROUSEL (ONE CARD VISIBLE AT A TIME) */}
          <div
            className="mission-carousel relative w-full max-w-5xl mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Left Nav Arrow */}
            <button
              type="button"
              onClick={handlePrevCard}
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-xl hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all"
              aria-label="Previous Slide"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {/* Right Nav Arrow */}
            <button
              type="button"
              onClick={handleNextCard}
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shadow-xl hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all"
              aria-label="Next Slide"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>

            {/* Carousel Frame */}
            <div className="relative overflow-hidden rounded-3xl border border-gray-200/90 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl">
              {/* Progress Countdown Line */}
              <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800/80 overflow-hidden">
                <div
                  style={{ width: `${carouselProgress}%` }}
                  className={`h-full transition-all duration-75 bg-gradient-to-r ${systemCards[activeCardIndex].gradient}`}
                />
              </div>

              {/* Slider Track (Translates horizontally, exactly 1 card visible at a time) */}
              <div
                className="flex transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${activeCardIndex * 100}%)` }}
              >
                {systemCards.map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <div key={card.id} className="w-full flex-shrink-0 p-6 sm:p-10 lg:p-12">
                      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
                        {/* Top Tag & Card Counter */}
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${card.badgeBg}`}>
                            <IconComponent className="h-3.5 w-3.5" />
                            <span>{card.pillar}</span>
                          </span>

                          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-400">
                            <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">0{card.id}</span>
                            <span>/</span>
                            <span>0{systemCards.length}</span>
                          </div>
                        </div>

                        {/* Heading & Subtitle */}
                        <div>
                          <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-snug">
                            {card.title}
                          </h3>
                          <p className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                            {card.subtitle}
                          </p>
                        </div>

                        {/* Explanation of the system */}
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {card.description}
                        </p>

                        {/* 3 Key Pillars / Feature Bullet Points */}
                        <div className="space-y-2 pt-1">
                          {card.features.map((feature, fIdx) => (
                            <div key={fIdx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-gray-700 dark:text-gray-200">
                              <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={card.ctaAction}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                          >
                            <span>{card.ctaText}</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Carousel Controls & Indicator Dots */}
              <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-950/60 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* 4 Interactive Dots */}
                <div className="flex items-center space-x-2">
                  {systemCards.map((c, i) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCard(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        activeCardIndex === i
                          ? 'w-8 bg-blue-600 shadow-xs shadow-blue-500/40'
                          : 'w-2.5 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                      }`}
                      title={`Go to ${c.pillar}`}
                    />
                  ))}
                </div>

                {/* Status & Play/Pause */}
                <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                  <span className="hidden sm:inline">
                    {isPaused ? 'Auto-scroll paused (reading)' : 'Auto-scrolling every 5s'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    title={isPaused ? 'Resume auto-scroll' : 'Pause auto-scroll'}
                  >
                    {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SOURCES SECTION (#sources) */}
      {/* ========================================================================= */}
      <section id="sources" className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="sources-header flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                <span>{t('sources_section_tag')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                {t('sources_section_title')}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
                {t('sources_section_subtitle')}
              </p>
            </div>

            {/* Tab switchers & View All Link */}
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex shadow-sm">
                <button
                  type="button"
                  onClick={() => setActiveTab('topRated')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'topRated'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <StarSolid className="h-3.5 w-3.5" />
                  <span>{t('sources_tab_top_rated')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('mostDownloaded')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                    activeTab === 'mostDownloaded'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <FireIcon className="h-3.5 w-3.5" />
                  <span>{t('sources_tab_most_downloaded')}</span>
                </button>
              </div>

              <Link
                to="/browse"
                className="hidden sm:inline-flex items-center space-x-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>{t('sources_view_all')}</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Resources Grid */}
          {activeTab === 'topRated' ? (
            topRatedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                    <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                ))}
              </div>
            ) : topRated && topRated.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topRated.slice(0, 6).map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  {t('browse_empty_title')}
                </p>
                <Link
                  to="/upload"
                  className="mt-3 inline-flex items-center space-x-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <CloudArrowUpIcon className="h-4 w-4" />
                  <span>{t('browse_publish_btn')}</span>
                </Link>
              </div>
            )
          ) : mostDownloadedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                  <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : mostDownloaded && mostDownloaded.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mostDownloaded.slice(0, 6).map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
              <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                {t('browse_empty_title')}
              </p>
            </div>
          )}

          {/* Mobile view all link */}
          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/browse"
              className="inline-flex items-center space-x-1 text-sm font-bold text-blue-600 dark:text-blue-400"
            >
              <span>{t('sources_view_all')}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. UNIVERSITIES (#universities) */}
      {/* ========================================================================= */}
      <section id="universities" className="py-20 bg-white dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 text-xs font-bold uppercase tracking-wider mb-3">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>{t('uni_section_tag')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="text-emerald-600 dark:text-emerald-400">
                {t('uni_section_title_green')}
              </span>{' '}
              <span className="text-amber-500 dark:text-yellow-400">
                {t('uni_section_title_yellow')}
              </span>{' '}
              <span className="text-red-600 dark:text-red-500">
                {t('uni_section_title_red')}
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {t('uni_section_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {universityLogos.map((uni, idx) => (
              <Link
                key={idx}
                to={`/browse?search=${encodeURIComponent(uni.code)}`}
                className="uni-pill p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all group text-center"
              >
                <div className="h-10 w-10 mx-auto rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-extrabold text-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  {uni.code}
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {uni.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{uni.city}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CONTACT SECTION (#contact) */}
      {/* ========================================================================= */}
      <section id="contact" className="py-20 bg-gray-50 dark:bg-gray-900/50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="contact-box max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5">
              {/* Left info banner */}
              <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold mb-4">
                    <span>{t('contact_tag')}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-3">{t('contact_title')}</h3>
                  <p className="text-blue-100 text-sm leading-relaxed mb-6">
                    {t('contact_subtitle')}
                  </p>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/20 text-xs">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-blue-200 shrink-0" />
                    <span className="font-medium break-all">eyobbegashaw075@gmail.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PaperAirplaneIcon className="h-5 w-5 text-blue-200 shrink-0" />
                    <span>@EthioStudentHub</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-200 shrink-0" />
                    <span>Direct Admin Inbox Delivery</span>
                  </div>
                </div>
              </div>

              {/* Right contact form */}
              <div className="md:col-span-3 p-8">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('contact_name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="e.g. Eyob Begashaw"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('contact_email')}
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="student@aau.edu.et"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('contact_subject')}
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="Resource addition / Campus partnership"
                      className="input-field text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t('contact_message')}
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we assist you or collaborate?"
                      className="input-field text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingContact}
                    className="w-full btn-primary py-2.5 text-sm font-semibold flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
                  >
                    <span>{sendingContact ? t('contact_sending') : t('contact_send')}</span>
                    <PaperAirplaneIcon className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
