import React from 'react';
import { Github, ExternalLink, Code2, Rocket, Heart, Lightbulb, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const About: React.FC = () => {
    const { t } = useLanguage();

    const improvements = [
        { icon: Globe, title: 'about.imp.cloud', desc: 'about.imp.cloudDesc' },
        { icon: ShieldCheck, title: 'about.imp.security', desc: 'about.imp.securityDesc' },
        { icon: Lightbulb, title: 'about.imp.theme', desc: 'about.imp.themeDesc' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{t('about.title')}</h1>
                <p className="text-slate-500 mt-1">{t('about.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-10 group-hover:opacity-20 transition-opacity"></div>

                        <div className="relative z-10">
                            <div className="w-32 h-32 mx-auto mb-6 rounded-full p-2 bg-white shadow-2xl">
                                <img
                                    src="https://github.com/Jean-EstevezT.png"
                                    alt="Jean Estevez"
                                    className="w-full h-full rounded-full object-cover"
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-slate-800 mb-1">Jean Estevez</h2>
                            <p className="text-indigo-600 font-medium mb-6 flex items-center justify-center gap-2">
                                <Code2 className="w-4 h-4" />
                                Python Developer
                            </p>

                            <p className="text-slate-500 mb-8 leading-relaxed">
                                {t('about.bio')}
                            </p>

                            <a
                                href="https://github.com/Jean-EstevezT"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-lg shadow-slate-200"
                            >
                                <Github className="w-5 h-5" />
                                {t('about.github')}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Rocket className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">{t('about.roadmap.title')}</h3>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {improvements.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <item.icon className="w-5 h-5 text-indigo-500" />
                                        <h4 className="font-bold text-slate-700">{t(item.title as any)}</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 ml-8">{t(item.desc as any)}</p>
                                </div>
                            ))}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-sm font-medium">
                                {t('about.more')}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">{t('about.feedback.title')}</h3>
                                <p className="text-indigo-100">{t('about.feedback.desc')}</p>
                            </div>
                            <a
                                href="https://github.com/Jean-EstevezT"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
                            >
                                <Github className="w-5 h-5" />
                                {t('about.contact')}
                            </a>
                        </div>
                        <Heart className="absolute -bottom-6 -right-6 w-32 h-32 text-indigo-500 opacity-20 rotate-12" />
                    </div>
                </div>
            </div>
        </div>
    );
};

import { Globe } from 'lucide-react';

export default About;
