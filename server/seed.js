require('dotenv').config();
const mongoose = require('mongoose');
const {
  LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource
} = require('./models/Research');

// ===== BIBLIOTHEK =====
const libraryData = [
  {
    title: 'Grundriss Soziale Arbeit',
    author: 'Thole, W.',
    year: 2012,
    category: 'sozialarbeit',
    publisher: 'VS Verlag',
    description: 'Umfassendes Standardwerk der Sozialen Arbeit mit Beiträgen zu Geschichte, Theorie und Praxis.',
    pages: 1064
  },
  {
    title: 'Methoden der Sozialen Arbeit',
    author: 'Galuske, M.',
    year: 2013,
    category: 'methoden',
    publisher: 'Juventa Verlag',
    description: 'Systematische Einführung in die wichtigsten Methoden der Sozialen Arbeit von Beratung bis Gruppenarbeit.',
    pages: 320
  },
  {
    title: 'Sozialgesetzbuch – Kommentar für die Praxis',
    author: 'Münder, J.',
    year: 2020,
    category: 'recht',
    publisher: 'Luchterhand Verlag',
    description: 'Praxiskommentar zu den wichtigsten Sozialgesetzbüchern (SGB II, VIII, XII) für Fachkräfte.',
    pages: 892
  },
  {
    title: 'Psychologie für Soziale Arbeit',
    author: 'Stimmer, F.',
    year: 2015,
    category: 'psychologie',
    publisher: 'Nomos Verlag',
    description: 'Einführung in psychologische Grundlagen für die Soziale Arbeit: Entwicklungspsychologie, klinische Psychologie und Beratung.',
    pages: 456
  },
  {
    title: 'Systemische Beratung und Therapie',
    author: 'von Schlippe, A. & Schweitzer, J.',
    year: 2019,
    category: 'methoden',
    publisher: 'Vandenhoeck & Ruprecht',
    description: 'Klassisches Lehrbuch der systemischen Praxis mit Fokus auf Familien- und Organisationsberatung.',
    pages: 384
  },
  {
    title: 'Empowerment in der Sozialen Arbeit',
    author: 'Herriger, N.',
    year: 2014,
    category: 'sozialarbeit',
    publisher: 'Kohlhammer Verlag',
    description: 'Theorie und Praxis des Empowerment-Ansatzes: Stärkung von Ressourcen und Selbstbestimmung der Klienten.',
    pages: 264
  },
  {
    title: 'Entwicklungspsychologie des Kindes- und Jugendalters',
    author: 'Siegler, R. et al.',
    year: 2016,
    category: 'psychologie',
    publisher: 'Springer Verlag',
    description: 'Umfassendes Standardwerk zur psychischen Entwicklung von der Geburt bis zur Adoleszenz.',
    pages: 736
  },
  {
    title: 'Sozialrecht – Grundkurs',
    author: 'Brühl, A.',
    year: 2021,
    category: 'recht',
    publisher: 'Nomos Verlag',
    description: 'Verständliche Einführung ins Sozialrecht für Studierende der Sozialen Arbeit und verwandter Fächer.',
    pages: 312
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
  {
    icon: '🏛️',
    name: 'DBSH',
    desc: 'Deutscher Berufsverband für Soziale Arbeit – Berufsethik, Stellenangebote, Mitgliedschaft',
    link: 'https://www.dbsh.de'
  },
  {
    icon: '📊',
    name: 'Destatis',
    desc: 'Statistisches Bundesamt – Sozialstatistiken, Armutsdaten, Bevölkerungsdaten',
    link: 'https://www.destatis.de'
  },
  {
    icon: '🏥',
    name: 'Caritas',
    desc: 'Wohlfahrtsverband mit umfangreichen Informationen zu Hilfsangeboten und Praktika',
    link: 'https://www.caritas.de'
  },
  {
    icon: '🤝',
    name: 'AWO',
    desc: 'Arbeiterwohlfahrt – Soziale Dienstleistungen, Stellenportal, Ehrenamt',
    link: 'https://www.awo.org'
  },
  {
    icon: '📋',
    name: 'BMFSFJ',
    desc: 'Bundesministerium für Familie – Gesetze, Förderprogramme, Kinder- und Jugendschutz',
    link: 'https://www.bmfsfj.de'
  },
  {
    icon: '📰',
    name: 'Socialnet',
    desc: 'Fachlexikon, Rezensionen und aktuelle Fachinformationen für die Soziale Arbeit',
    link: 'https://www.socialnet.de'
  },
  {
    icon: '🎓',
    name: 'DZI',
    desc: 'Deutsches Zentralinstitut für soziale Fragen – Spendensiegel, Fachdatenbank',
    link: 'https://www.dzi.de'
  }
];

// ===== SEED-FUNKTION (exportierbar) =====
async function seedDatabase() {
  await LibraryItem.deleteMany({});
  await CaseStudy.deleteMany({});
  await Flashcard.deleteMany({});
  await Group.deleteMany({});
  await Mentor.deleteMany({});
  await Resource.deleteMany({});

  await LibraryItem.insertMany(libraryData);
  await CaseStudy.insertMany(casesData);
  await Flashcard.insertMany(flashcardsData);
  await Group.insertMany(groupsData);
  await Mentor.insertMany(mentorsData);
  await Resource.insertMany(resourcesData);

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
