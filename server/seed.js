require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const {
  LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource
} = require('./models/Research');

// ===== TEST-BENUTZER =====
const usersData = [
  {
    name: 'Test Nutzer',
    username: 'test',
    email: 'test@sozialapp.de',
    password: 'Test1234',
    bio: 'Demo-Account für Tests',
    emoji: '🧪'
  },
  {
    name: 'Anna Müller',
    username: 'anna',
    email: 'anna@sozialapp.de',
    password: 'Anna1234',
    bio: 'Studentin der Sozialen Arbeit im 4. Semester',
    emoji: '👩‍🎓'
  }
];

// ===== BIBLIOTHEK =====
const libraryData = [
  // ---- Bestehende Bücher mit Links ----
  {
    title: 'Grundriss Soziale Arbeit',
    author: 'Thole, W.',
    year: 2012,
    category: 'sozialarbeit',
    publisher: 'VS Verlag',
    description: 'Umfassendes Standardwerk der Sozialen Arbeit mit Beiträgen zu Geschichte, Theorie und Praxis.',
    pages: 1064,
    link: 'https://www.springer.com/book/9783531175065',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=soziale+arbeit+thole'
  },
  {
    title: 'Methoden der Sozialen Arbeit',
    author: 'Galuske, M.',
    year: 2013,
    category: 'methoden',
    publisher: 'Juventa Verlag',
    description: 'Systematische Einführung in die wichtigsten Methoden der Sozialen Arbeit von Beratung bis Gruppenarbeit.',
    pages: 320,
    link: 'https://www.beltz.de',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=methoden+soziale+arbeit'
  },
  {
    title: 'Sozialgesetzbuch – Kommentar für die Praxis',
    author: 'Münder, J.',
    year: 2020,
    category: 'recht',
    publisher: 'Luchterhand Verlag',
    description: 'Praxiskommentar zu den wichtigsten Sozialgesetzbüchern (SGB II, VIII, XII) für Fachkräfte.',
    pages: 892,
    link: 'https://www.wolterskluwer.com/de',
    freeLink: 'https://www.gesetze-im-internet.de'
  },
  {
    title: 'Psychologie für Soziale Arbeit',
    author: 'Stimmer, F.',
    year: 2015,
    category: 'psychologie',
    publisher: 'Nomos Verlag',
    description: 'Einführung in psychologische Grundlagen für die Soziale Arbeit: Entwicklungspsychologie, klinische Psychologie und Beratung.',
    pages: 456,
    link: 'https://www.nomos-shop.de',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=psychologie+soziale+arbeit'
  },
  {
    title: 'Systemische Beratung und Therapie',
    author: 'von Schlippe, A. & Schweitzer, J.',
    year: 2019,
    category: 'methoden',
    publisher: 'Vandenhoeck & Ruprecht',
    description: 'Klassisches Lehrbuch der systemischen Praxis mit Fokus auf Familien- und Organisationsberatung.',
    pages: 384,
    link: 'https://www.vandenhoeck-ruprecht-verlage.com',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=systemische+beratung+soziale+arbeit'
  },
  {
    title: 'Empowerment in der Sozialen Arbeit',
    author: 'Herriger, N.',
    year: 2014,
    category: 'sozialarbeit',
    publisher: 'Kohlhammer Verlag',
    description: 'Theorie und Praxis des Empowerment-Ansatzes: Stärkung von Ressourcen und Selbstbestimmung der Klienten.',
    pages: 264,
    link: 'https://www.kohlhammer.de',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=empowerment+soziale+arbeit'
  },
  {
    title: 'Entwicklungspsychologie des Kindes- und Jugendalters',
    author: 'Siegler, R. et al.',
    year: 2016,
    category: 'psychologie',
    publisher: 'Springer Verlag',
    description: 'Umfassendes Standardwerk zur psychischen Entwicklung von der Geburt bis zur Adoleszenz.',
    pages: 736,
    link: 'https://www.springer.com',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=entwicklungspsychologie+kinder'
  },
  {
    title: 'Sozialrecht – Grundkurs',
    author: 'Brühl, A.',
    year: 2021,
    category: 'recht',
    publisher: 'Nomos Verlag',
    description: 'Verständliche Einführung ins Sozialrecht für Studierende der Sozialen Arbeit und verwandter Fächer.',
    pages: 312,
    link: 'https://www.nomos-shop.de',
    freeLink: 'https://www.gesetze-im-internet.de'
  },
  // ---- Neue Bücher & freie Publikationen ----
  {
    title: '16. Kinder- und Jugendbericht',
    author: 'Bundesministerium für Familie (BMFSFJ)',
    year: 2020,
    category: 'sozialarbeit',
    publisher: 'BMFSFJ',
    description: 'Offizieller Bericht der Bundesregierung zur Lage junger Menschen in Deutschland. Schwerpunkt: Förderung demokratischer Bildung.',
    pages: 368,
    freeLink: 'https://www.bmfsfj.de/bmfsjf/service/publikationen/16--kinder--und-jugendbericht-217308',
    link: 'https://www.bmfsfj.de'
  },
  {
    title: 'Armutsbericht Deutschland',
    author: 'Der Paritätische Gesamtverband',
    year: 2023,
    category: 'sozialarbeit',
    publisher: 'Paritätischer Wohlfahrtsverband',
    description: 'Jährlicher Bericht zur Armutsentwicklung in Deutschland mit regionalen Daten, Analysen und sozialpolitischen Forderungen.',
    pages: 80,
    freeLink: 'https://www.der-paritaetische.de/publikationen/armutsbericht',
    link: 'https://www.der-paritaetische.de'
  },
  {
    title: 'Handbuch Kinder- und Jugendhilfe',
    author: 'Schröer, W. et al.',
    year: 2022,
    category: 'sozialarbeit',
    publisher: 'Juventa Verlag',
    description: 'Umfassendes Nachschlagewerk zu allen Bereichen der Kinder- und Jugendhilfe – von ASD bis Heimerziehung.',
    pages: 1200,
    link: 'https://www.beltz.de',
    freeLink: 'https://www.dji.de/publikationen.html'
  },
  {
    title: 'Soziale Arbeit und Menschenrechte',
    author: 'Staub-Bernasconi, S.',
    year: 2019,
    category: 'sozialarbeit',
    publisher: 'Barbara Budrich Verlag',
    description: 'Menschenrechte als Grundlage und Mandat Sozialer Arbeit – theoretische Fundierung und praktische Konsequenzen.',
    pages: 248,
    link: 'https://www.budrich.de',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=soziale+arbeit+menschenrechte'
  },
  {
    title: 'Case Management – Grundlagen und Anwendung',
    author: 'Wendt, W. R.',
    year: 2021,
    category: 'methoden',
    publisher: 'Lambertus Verlag',
    description: 'Standardwerk zum Case Management: Assessment, Hilfeplanung, Koordination und Evaluation von Hilfeleistungen.',
    pages: 280,
    link: 'https://www.lambertus.de',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=case+management+soziale+arbeit'
  },
  {
    title: 'Flucht, Migration und Soziale Arbeit',
    author: 'Braches-Chyrek, R. et al.',
    year: 2020,
    category: 'sozialarbeit',
    publisher: 'Barbara Budrich Verlag',
    description: 'Praxis und Theorie der Sozialen Arbeit mit Geflüchteten: interkulturelle Kompetenz, Rechtsgrundlagen, Handlungsansätze.',
    pages: 290,
    link: 'https://www.budrich.de',
    freeLink: 'https://www.ssoar.info/ssoar/discover?query=migration+flucht+soziale+arbeit'
  },
  {
    title: 'Sucht und Soziale Arbeit',
    author: 'Stimmer, F. & Müller-Teusler, S.',
    year: 2018,
    category: 'methoden',
    publisher: 'Kohlhammer Verlag',
    description: 'Grundlagen der Suchtberatung und Suchthilfe: Abhängigkeitserkrankungen, motivierende Gesprächsführung, Interventionsplanung.',
    pages: 240,
    link: 'https://www.kohlhammer.de',
    freeLink: 'https://www.bzga.de/infomaterialien/suchtvorbeugung'
  },
  {
    title: 'Kindeswohlgefährdung erkennen und helfen',
    author: 'Kindler, H. et al.',
    year: 2019,
    category: 'recht',
    publisher: 'Juventa Verlag',
    description: 'Praxisorientiertes Handbuch zum Schutzauftrag nach § 8a SGB VIII – Risikoeinschätzung, Kooperation und Intervention.',
    pages: 320,
    link: 'https://www.beltz.de',
    freeLink: 'https://www.dji.de/ueber-das-dji/abteilungen/jugend-und-jugendhilfe/pf/projekte/kinderschutz.html'
  },
  {
    title: 'Berufsethik der Sozialen Arbeit',
    author: 'DBSH (Hrsg.)',
    year: 2021,
    category: 'sozialarbeit',
    publisher: 'DBSH',
    description: 'Offizielle Berufsethik des Deutschen Berufsverbands für Soziale Arbeit – Grundwerte, Prinzipien und ethische Richtlinien.',
    pages: 48,
    freeLink: 'https://www.dbsh.de/profession/berufsethik.html',
    link: 'https://www.dbsh.de'
  }
];

// ===== FALLSTUDIEN =====
const casesData = [
  {
    title: 'Schulverweigerung bei Jugendlichem',
    category: 'Kinder & Jugendhilfe',
    alter: '15 Jahre',
    emoji: '🎒',
    situation: 'Kevin besucht seit drei Monaten nicht mehr regelmäßig die Schule. Die Mutter wendet sich hilfesuchend an das Jugendamt.',
    problem: 'Schulverweigerung, soziale Isolation, beginnende Delinquenz, familiäre Konflikte zwischen Mutter und Sohn.',
    intervention: 'Einzelberatung mit Kevin, Elterngespräch, Kooperation mit der Schule und dem Schulpsychologischen Dienst. Einleitung ambulanter Erziehungshilfe (§ 27 SGB VIII).',
    ergebnis: 'Schrittweise Wiedereingliederung in den Schulalltag nach sechs Wochen. Kevin nimmt an einer sozialpädagogischen Gruppenmaßnahme teil.',
    dauer: '6 Monate'
  },
  {
    title: 'Ältere Dame mit beginnender Demenz',
    category: 'Altenbetreuung',
    alter: '78 Jahre',
    emoji: '👵',
    situation: 'Frau Hartmann lebt allein. Die Tochter bemerkt zunehmende Vergesslichkeit und Orientierungslosigkeit. Der Haushalt wird vernachlässigt.',
    problem: 'Beginnende Demenz, Vereinsamung, Selbstversorgungsdefizite, fehlende Tagesstruktur, überlastete Angehörige.',
    intervention: 'Pflegeberatung (§ 7a SGB XI), Antrag auf Pflegegrad, Einrichtung eines ambulanten Pflegedienstes, Anmeldung in einer Tagesbetreuungsstätte, Entlastungsangebote für die Tochter.',
    ergebnis: 'Pflegegrad 2 bewilligt. Frau Hartmann erhält dreimal wöchentlich ambulante Pflege und besucht zweimal wöchentlich die Tagespflege. Stabilisierung der häuslichen Situation.',
    dauer: '4 Monate'
  },
  {
    title: 'Familie mit Suchtproblemen',
    category: 'Suchtberatung',
    alter: '38 Jahre',
    emoji: '🏠',
    situation: 'Herr und Frau Bauer haben zwei Kinder (6 und 9 Jahre). Herr Bauer ist alkoholabhängig, was zu wiederholten häuslichen Konflikten führt.',
    problem: 'Alkoholabhängigkeit, Kindeswohlgefährdung (latent), finanzielle Schulden, drohender Jobverlust, belastete Paardynamik.',
    intervention: 'Suchtberatung für Herrn Bauer, Motivierende Gesprächsführung, Vermittlung in stationäre Entwöhnung, Begleitung der Familie durch ASD, Schuldnerberatung.',
    ergebnis: 'Herr Bauer absolviert eine 12-wöchige stationäre Entwöhnung. Anschließend ambulante Nachsorge. Familie stabilisiert sich schrittweise.',
    dauer: '10 Monate'
  },
  {
    title: 'Geflüchtete Familie',
    category: 'Flüchtlingshilfe',
    alter: '34 Jahre',
    emoji: '🌍',
    situation: 'Familie Al-Rashid aus Syrien lebt seit einem Jahr in Deutschland. Asylverfahren läuft. Sprachbarrieren erschweren den Alltag erheblich.',
    problem: 'Sprachbarriere, ungesicherter Aufenthaltsstatus, Traumatisierung, Wohnraumprobleme, fehlende soziale Einbindung.',
    intervention: 'Migrationsberatung, Unterstützung im Asylverfahren mit Dolmetscher, Vermittlung in Sprachkurs (Integrationskurs), Traumaberatung, Anbindung an eine Willkommensgruppe.',
    ergebnis: 'Asylantrag positiv beschieden. Familie erhält eine eigene Wohnung. Die Eltern besuchen Integrationskurse, die Kinder sind in der Schule angemeldet.',
    dauer: '8 Monate'
  },
  {
    title: 'Überschuldeter Alleinerzieher',
    category: 'Sozialhilfe',
    alter: '42 Jahre',
    emoji: '💶',
    situation: 'Herr Müller ist allein erziehend (zwei Kinder, 7 und 11 Jahre). Seit dem Jobverlust vor einem Jahr häufen sich die Schulden.',
    problem: 'Überschuldung (28.000 €), ALG II-Bezug, drohende Kontopfändung, psychische Belastung, Kinderbetreuungsprobleme.',
    intervention: 'Schuldnerberatung, Erstellung eines Haushaltsplans, Verhandlung mit Gläubigern, Antrag auf Verbraucherinsolvenz, Unterstützung bei Bewerbungen, Kita-Gutschein für das jüngere Kind.',
    ergebnis: 'Verbraucherinsolvenz eingeleitet. Kontopfändung abgewendet. Herr Müller nimmt an einer Qualifizierungsmaßnahme teil.',
    dauer: '12 Monate'
  }
];

// ===== LERNKARTEN =====
const flashcardsData = [
  {
    question: 'Was ist Soziale Arbeit?',
    answer: 'Soziale Arbeit ist eine Profession und wissenschaftliche Disziplin, die sozialen Wandel, Problemlösungen in menschlichen Beziehungen sowie die Ermächtigung und Befreiung von Menschen fördert. Grundlage sind Menschenrechte und soziale Gerechtigkeit (IFSW-Definition).'
  },
  {
    question: 'Was versteht man unter Empowerment?',
    answer: 'Empowerment bezeichnet den Prozess, durch den Menschen, Organisationen und Gemeinschaften Kontrolle über ihr eigenes Leben gewinnen. In der Sozialen Arbeit geht es darum, Stärken und Ressourcen von Klienten zu fördern statt Defizite zu betonen.'
  },
  {
    question: 'Was ist Case Management?',
    answer: 'Case Management ist ein Verfahren zur Koordination von Hilfeleistungen für komplexe Fälle. Kernschritte: Assessment (Bedarfserhebung), Planung, Linking (Vernetzung), Monitoring und Evaluation. Ziel ist eine effiziente, klientenorientierte Unterstützung.'
  },
  {
    question: 'Was bedeutet Lebensweltorientierung?',
    answer: 'Lebensweltorientierung (Thiersch) bedeutet, dass Soziale Arbeit die Alltagswelt der Klienten als Ausgangspunkt nimmt. Die sieben Strukturmaximen sind: Prävention, Dezentralisierung, Alltagsnähe, Integration, Partizipation, Vernetzung und Normalisierung.'
  },
  {
    question: 'Was ist das Subsidiaritätsprinzip?',
    answer: 'Das Subsidiaritätsprinzip besagt, dass Aufgaben von der kleinstmöglichen Einheit übernommen werden sollen. Im Sozialrecht: Selbsthilfe vor Familienhilfe, Familie vor freiem Träger, freier Träger vor staatlichem Träger.'
  },
  {
    question: 'Was sind die Aufgaben des Allgemeinen Sozialen Dienstes (ASD)?',
    answer: 'Der ASD ist der kommunale Sozialdienst des Jugendamts. Aufgaben: Beratung von Familien und Einzelpersonen, Einleitung von Hilfen zur Erziehung, Kinderschutz (Schutzauftrag § 8a SGB VIII), Mitwirkung in familiengerichtlichen Verfahren.'
  },
  {
    question: 'Was ist Kindeswohlgefährdung (§ 8a SGB VIII)?',
    answer: 'Kindeswohlgefährdung liegt vor, wenn das körperliche, geistige oder seelische Wohl eines Kindes gefährdet ist und die Eltern nicht schutzbereit oder -fähig sind. Formen: Vernachlässigung, körperliche/seelische Misshandlung, sexueller Missbrauch.'
  },
  {
    question: 'Was ist Motivierende Gesprächsführung (Motivational Interviewing)?',
    answer: 'Motivierende Gesprächsführung (Miller & Rollnick) ist ein klientenzentrierter, direktiver Gesprächsstil zur Stärkung intrinsischer Motivation. Grundprinzipien: Empathie ausdrücken, Diskrepanz entwickeln, Widerstand aufnehmen, Selbstwirksamkeit fördern (OARS-Methode).'
  },
  {
    question: 'Was sind Hilfen zur Erziehung (§§ 27-35 SGB VIII)?',
    answer: 'Hilfen zur Erziehung sind Leistungen des Jugendamts für Eltern, die Unterstützung bei der Erziehung benötigen. Formen: Erziehungsberatung (§28), soziale Gruppenarbeit (§29), sozialpädagogische Familienhilfe (§31), Heimerziehung (§34) u.a.'
  },
  {
    question: 'Was ist das Genogramm?',
    answer: 'Das Genogramm ist ein grafisches Instrument zur Darstellung von Familiensystemen über mehrere Generationen. Es zeigt Beziehungsstrukturen, Konflikte, Verluste und Ressourcen. Verwendung in der systemischen Beratung und Familientherapie.'
  },
  {
    question: 'Was versteht man unter sozialer Inklusion?',
    answer: 'Soziale Inklusion bezeichnet die vollständige gesellschaftliche Teilhabe aller Menschen unabhängig von Behinderung, Herkunft oder sozialem Status. Rechtsgrundlage: UN-Behindertenrechtskonvention (UN-BRK). Gegensatz: Exklusion (Ausgrenzung).'
  },
  {
    question: 'Was ist die Grundsicherung für Arbeitsuchende (SGB II)?',
    answer: 'SGB II ("Bürgergeld") sichert das Existenzminimum für erwerbsfähige Leistungsberechtigte und deren Haushaltsangehörige. Leistungen: Regelbedarf, Kosten der Unterkunft, Eingliederungsleistungen. Träger: Jobcenter (gemeinsame Einrichtung von BA und Kommune).'
  }
];

// ===== GRUPPEN =====
const groupsData = [
  {
    name: 'Kinder & Jugendhilfe Studis',
    members: 34,
    icon: '👧',
    topic: 'SGB VIII, Fallarbeit, Praktikum'
  },
  {
    name: 'Sozialrecht Prüfungsvorbereitung',
    members: 28,
    icon: '📚',
    topic: 'SGB II, SGB XII, Klausurvorbereitung'
  },
  {
    name: 'Praktikumserfahrungen teilen',
    members: 52,
    icon: '🏢',
    topic: 'Berichte, Tipps, Träger-Erfahrungen'
  },
  {
    name: 'Systemische Methoden',
    members: 19,
    icon: '🔄',
    topic: 'Systemische Beratung, Genogramm, Skulptur'
  },
  {
    name: 'Migrationsarbeit & Flucht',
    members: 41,
    icon: '🌍',
    topic: 'Asylrecht, interkulturelle Kompetenz'
  },
  {
    name: 'Abschlussarbeiten & Themen',
    members: 67,
    icon: '✍️',
    topic: 'Bachelor-/Masterarbeit, Themenfindung, Methodik'
  }
];

// ===== MENTOREN =====
const mentorsData = [
  {
    name: 'Prof. Dr. Angela Müller',
    fach: 'Sozialrecht & Sozialpolitik',
    emoji: '⚖️',
    verfuegbar: true
  },
  {
    name: 'Prof. Dr. Thomas Schmidt',
    fach: 'Klinische Sozialarbeit & Beratung',
    emoji: '🧠',
    verfuegbar: true
  },
  {
    name: 'Dipl. Soz. Arb. Sarah Weber',
    fach: 'Kinder- & Jugendhilfe, ASD',
    emoji: '👨‍👩‍👧',
    verfuegbar: false
  },
  {
    name: 'Prof. Dr. Klaus Hoffmann',
    fach: 'Sozialarbeitswissenschaft & Forschung',
    emoji: '🔬',
    verfuegbar: true
  },
  {
    name: 'M.A. Leila Özdemir',
    fach: 'Migrationsberatung & interkulturelle Arbeit',
    emoji: '🌍',
    verfuegbar: false
  }
];

// ===== RESSOURCEN =====
const resourcesData = [
  // --- Organisationen ---
  {
    icon: '🏛️',
    name: 'DBSH',
    desc: 'Deutscher Berufsverband für Soziale Arbeit – Berufsethik, Stellenangebote, Mitgliedschaft',
    link: 'https://www.dbsh.de',
    category: 'organisation'
  },
  {
    icon: '🏥',
    name: 'Caritas',
    desc: 'Wohlfahrtsverband mit umfangreichen Informationen zu Hilfsangeboten und Praktika',
    link: 'https://www.caritas.de',
    category: 'organisation'
  },
  {
    icon: '🤝',
    name: 'AWO',
    desc: 'Arbeiterwohlfahrt – Soziale Dienstleistungen, Stellenportal, Ehrenamt',
    link: 'https://www.awo.org',
    category: 'organisation'
  },
  {
    icon: '🎓',
    name: 'DZI',
    desc: 'Deutsches Zentralinstitut für soziale Fragen – Spendensiegel, Fachdatenbank',
    link: 'https://www.dzi.de',
    category: 'organisation'
  },
  // --- Kostenlose Literatur & Repositorien ---
  {
    icon: '📂',
    name: 'SSOAR',
    desc: 'Social Science Open Access Repository – tausende kostenlose Fachartikel und Bücher zu Sozialer Arbeit, Soziologie und Pädagogik',
    link: 'https://www.ssoar.info',
    category: 'literatur'
  },
  {
    icon: '🔍',
    name: 'BASE',
    desc: 'Bielefeld Academic Search Engine – 300 Mio. Open-Access-Dokumente aus Wissenschaft und Forschung durchsuchen',
    link: 'https://www.base-search.net',
    category: 'literatur'
  },
  {
    icon: '🎓',
    name: 'Google Scholar',
    desc: 'Wissenschaftliche Suche – findet häufig kostenlose PDF-Versionen von Fachartikeln direkt über den Link',
    link: 'https://scholar.google.de',
    category: 'literatur'
  },
  {
    icon: '📚',
    name: 'OAPEN',
    desc: 'Open Access-Bücher aus europäischen Wissenschaftsverlagen – viele deutschsprachige Titel kostenlos als PDF',
    link: 'https://www.oapen.org',
    category: 'literatur'
  },
  {
    icon: '📖',
    name: 'pedocs',
    desc: 'Open-Access-Repositorium für Erziehungswissenschaft und Bildungsforschung – kostenlose Volltexte',
    link: 'https://www.pedocs.de',
    category: 'literatur'
  },
  {
    icon: '📰',
    name: 'Socialnet Lexikon',
    desc: 'Kostenloses Fachlexikon der Sozialen Arbeit mit über 1.500 Einträgen zu Methoden, Konzepten und Fachbegriffen',
    link: 'https://www.socialnet.de/lexikon',
    category: 'literatur'
  },
  {
    icon: '🏫',
    name: 'DJI Publikationen',
    desc: 'Deutsches Jugendinstitut – alle Forschungsberichte, Expertisen und Studien zu Kinder- und Jugendhilfe kostenlos als PDF',
    link: 'https://www.dji.de/publikationen.html',
    category: 'literatur'
  },
  {
    icon: '🔬',
    name: 'ISS Frankfurt',
    desc: 'Institut für Sozialarbeit und Sozialpädagogik – kostenlose Forschungsberichte und Praxismaterialien',
    link: 'https://www.iss-ffm.de/publikationen',
    category: 'literatur'
  },
  {
    icon: '🌍',
    name: 'DOAJ',
    desc: 'Directory of Open Access Journals – Verzeichnis von über 20.000 begutachteten Open-Access-Fachzeitschriften weltweit',
    link: 'https://www.doaj.org',
    category: 'literatur'
  },
  {
    icon: '💊',
    name: 'BZgA Publikationen',
    desc: 'Bundeszentrale für gesundheitliche Aufklärung – kostenlose Materialien zu Sucht, Prävention und Gesundheitsförderung',
    link: 'https://www.bzga.de/infomaterialien',
    category: 'literatur'
  },
  {
    icon: '🧒',
    name: 'AGJ Publikationen',
    desc: 'Arbeitsgemeinschaft für Kinder- und Jugendhilfe – Stellungnahmen, Empfehlungen und Fachbeiträge kostenlos',
    link: 'https://www.agj.de/publikationen.html',
    category: 'literatur'
  },
  {
    icon: '🏠',
    name: 'Paritätischer Wohlfahrtsverband',
    desc: 'Fachpublikationen zu Armut, Pflege, Behinderung und Sozialrecht – viele Berichte kostenlos downloadbar',
    link: 'https://www.der-paritaetische.de/publikationen',
    category: 'literatur'
  },
  // --- Recht & Gesetze ---
  {
    icon: '⚖️',
    name: 'Gesetze im Internet',
    desc: 'Alle deutschen Gesetze kostenlos im Volltext – SGB I–XII, BGB, StGB und mehr. Offizielle Quelle des BMJV',
    link: 'https://www.gesetze-im-internet.de',
    category: 'recht'
  },
  {
    icon: '👶',
    name: 'SGB VIII (KJHG)',
    desc: 'Sozialgesetzbuch VIII – Kinder- und Jugendhilfe – vollständiger Gesetzestext direkt abrufbar',
    link: 'https://www.gesetze-im-internet.de/sgb_8',
    category: 'recht'
  },
  {
    icon: '💶',
    name: 'SGB II (Bürgergeld)',
    desc: 'Sozialgesetzbuch II – Grundsicherung für Arbeitsuchende – vollständiger Gesetzestext',
    link: 'https://www.gesetze-im-internet.de/sgb_2',
    category: 'recht'
  },
  {
    icon: '🧓',
    name: 'SGB XI (Pflege)',
    desc: 'Sozialgesetzbuch XI – Soziale Pflegeversicherung – vollständiger Gesetzestext',
    link: 'https://www.gesetze-im-internet.de/sgb_11',
    category: 'recht'
  },
  {
    icon: '📋',
    name: 'BMFSFJ Publikationen',
    desc: 'Bundesministerium für Familie – Kinder- und Jugendberichte, Familienberichte, alle Studien kostenlos',
    link: 'https://www.bmfsfj.de/bmfsfj/publikationen',
    category: 'recht'
  },
  // --- Statistik & Daten ---
  {
    icon: '📊',
    name: 'Destatis',
    desc: 'Statistisches Bundesamt – Sozialstatistiken, Armutsdaten, Bevölkerungsdaten und Zeitreihen kostenlos',
    link: 'https://www.destatis.de',
    category: 'statistik'
  },
  {
    icon: '🗺️',
    name: 'Regionaldatenbank',
    desc: 'Statistische Daten auf Kreis- und Gemeindeebene – für sozialräumliche Analysen im Studium und Praktikum',
    link: 'https://www.regionalstatistik.de',
    category: 'statistik'
  },
  {
    icon: '📈',
    name: 'BAMF Migrationsberichte',
    desc: 'Bundesamt für Migration – jährliche Migrationsberichte, Studien und Statistiken kostenlos als PDF',
    link: 'https://www.bamf.de/DE/Themen/Forschung/forschung-node.html',
    category: 'statistik'
  }
];

// ===== SEED-FUNKTION (exportierbar) =====
async function seedDatabase() {
  await User.deleteMany({});
  await LibraryItem.deleteMany({});
  await CaseStudy.deleteMany({});
  await Flashcard.deleteMany({});
  await Group.deleteMany({});
  await Mentor.deleteMany({});
  await Resource.deleteMany({});

  // Benutzer mit gehashetem Passwort anlegen
  for (const u of usersData) {
    const user = new User(u);
    await user.save(); // pre-save hook hasht das Passwort
  }

  await LibraryItem.insertMany(libraryData);
  await CaseStudy.insertMany(casesData);
  await Flashcard.insertMany(flashcardsData);
  await Group.insertMany(groupsData);
  await Mentor.insertMany(mentorsData);
  await Resource.insertMany(resourcesData);

  console.log(`✓ ${usersData.length} Test-Benutzer`);
  console.log(`✓ ${libraryData.length} Bibliothekseinträge`);
  console.log(`✓ ${casesData.length} Fallstudien`);
  console.log(`✓ ${flashcardsData.length} Lernkarten`);
  console.log(`✓ ${groupsData.length} Gruppen`);
  console.log(`✓ ${mentorsData.length} Mentoren`);
  console.log(`✓ ${resourcesData.length} Ressourcen`);
  console.log('Seed erfolgreich abgeschlossen!');
}

module.exports = { seedDatabase };

// Direkt ausführbar: node server/seed.js
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('MongoDB verbunden – Daten werden eingespielt...');
      await seedDatabase();
      process.exit(0);
    })
    .catch(err => {
      console.error('Fehler:', err.message);
      process.exit(1);
    });
}
