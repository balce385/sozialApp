require('dotenv').config();
const mongoose = require('mongoose');
const { LibraryItem, CaseStudy, Flashcard, Group, Mentor, Resource } = require('./models/Research');

const bibliothek = [
  { title: 'Grundriss Soziale Arbeit', author: 'Thole, W.', year: 2012, category: 'sozialarbeit', publisher: 'VS Verlag', description: 'Standardwerk der Sozialen Arbeit – umfassende Einführung in Geschichte, Theorie und Praxis.', pages: 1064 },
  { title: 'Einführung in die Soziale Arbeit', author: 'Galuske, M.', year: 2011, category: 'sozialarbeit', publisher: 'Juventa', description: 'Klassische Einführung mit Überblick über Methoden, Handlungsfelder und Theorien.', pages: 368 },
  { title: 'Klinische Sozialarbeit', author: 'Pauls, H.', year: 2011, category: 'sozialarbeit', publisher: 'Beltz Juventa', description: 'Theorie und Praxis klinischer Sozialarbeit im Gesundheitswesen.', pages: 336 },
  { title: 'Sozialgesetzbuch VIII – Kinder- und Jugendhilfe', author: 'Münder, J. et al.', year: 2022, category: 'recht', publisher: 'Nomos', description: 'Kommentar zum SGB VIII mit allen aktuellen Änderungen durch das KJSG.', pages: 1200 },
  { title: 'Soziale Arbeit als Menschenrechtsprofession', author: 'Staub-Bernasconi, S.', year: 2007, category: 'sozialarbeit', publisher: 'Haupt', description: 'Begründung Sozialer Arbeit als internationale Menschenrechtsprofession.', pages: 312 },
  { title: 'Entwicklungspsychologie', author: 'Oerter, R. & Montada, L.', year: 2008, category: 'psychologie', publisher: 'Beltz', description: 'Standardwerk der Entwicklungspsychologie – Lebensspanne und Entwicklungsaufgaben.', pages: 1064 },
  { title: 'Systemische Soziale Arbeit', author: 'Pantucek-Eisenbacher, P.', year: 2019, category: 'methoden', publisher: 'Beltz Juventa', description: 'Systemtheoretische Grundlagen und ihre Anwendung in der Sozialen Arbeit.', pages: 248 },
  { title: 'Motivierende Gesprächsführung', author: 'Miller, W. R. & Rollnick, S.', year: 2015, category: 'methoden', publisher: 'Lambertus', description: 'Die Methode des Motivational Interviewing (MI) für Beratung und Therapie.', pages: 456 }
];

const fallstudien = [
  { title: 'Schulverweigerung – Jugendlicher Kevin (15)', category: 'jugend', alter: '15 Jahre', emoji: '🏫',
    situation: 'Kevin besucht seit 3 Monaten nicht mehr die Schule. Die Eltern sind überfordert und drohen mit dem Jugendamt.',
    problem: 'Schulverweigerung, soziale Isolation, familiäre Konflikte, Verdacht auf Mobbing.',
    intervention: 'Einzelberatung mit Kevin, systemische Familienberatung, Kontakt mit Schulsozialarbeit, Clearing-Gespräch Jugendamt.',
    ergebnis: 'Schrittweise Wiedereingliederung nach Schulwechsel; familiäre Situation stabilisiert.',
    dauer: '6 Monate' },
  { title: 'Suchtproblematik – Erwachsener Marc (34)', category: 'sucht', alter: '34 Jahre', emoji: '💊',
    situation: 'Marc ist seit 5 Jahren alkoholabhängig. Er hat seinen Job verloren und droht seine Wohnung zu verlieren.',
    problem: 'Alkoholabhängigkeit, drohende Obdachlosigkeit, soziale Isolation, Schulden.',
    intervention: 'Motivierende Gesprächsführung, Vermittlung in Suchtberatungsstelle, Schuldnerberatung, Wohnerhalt.',
    ergebnis: 'Aufnahme einer Entwöhnungsbehandlung, Wohnsicherung, erste Entschuldung.',
    dauer: '8 Monate' },
  { title: 'Pflegefall – Rentnerin Hildegard (78)', category: 'pflege', alter: '78 Jahre', emoji: '👵',
    situation: 'Hildegard lebt allein, zeigt Anzeichen von Demenz. Ihre Tochter wohnt 200 km entfernt.',
    problem: 'Beginnende Demenz, Selbstgefährdung, soziale Isolation, Überforderung Angehörige.',
    intervention: 'Pflegegutachten, ambulanter Pflegedienst, Tagesbetreuung, Angehörigenberatung, Vollmacht klären.',
    ergebnis: 'Pflegegrad 2 bewilligt, stabile ambulante Versorgung, entlastete Angehörige.',
    dauer: '4 Monate' }
];

const karteikarten = [
  { question: 'Was ist die IFSW-Definition Sozialer Arbeit (2014)?', answer: 'Soziale Arbeit fördert sozialen Wandel und Entwicklung, sozialen Zusammenhalt sowie Stärkung und Befreiung von Menschen. Grundlage: Menschenrechte und soziale Gerechtigkeit.' },
  { question: 'Was ist das Subsidiaritätsprinzip?', answer: 'Übergeordnete Instanzen sollen nur tätig werden, wenn untergeordnete (Familie, Einzelperson) die Aufgabe nicht selbst bewältigen können. Kernelement der deutschen Sozialpolitik.' },
  { question: 'Was regelt § 8a SGB VIII?', answer: 'Schutzauftrag bei Kindeswohlgefährdung: Jugendamt muss bei Hinweisen auf Gefährdung tätig werden, Hausbesuch, Einschaltung Familiengericht bei akuter Gefahr.' },
  { question: 'Was ist die lebensweltorientierte Soziale Arbeit (Thiersch)?', answer: 'Ansatz von Hans Thiersch: Soziale Arbeit setzt an den Alltagswelten der Menschen an. Ziel: Gelingendes Alltagsleben durch Unterstützung in Raum, Zeit und sozialen Bezügen.' },
  { question: 'Was ist der Capabilities-Ansatz (Sen/Nussbaum)?', answer: 'Menschen sollen in der Lage sein, grundlegende menschliche Fähigkeiten (Capabilities) zu entwickeln und zu nutzen. Basis für eine gerechtigkeitsorientierte Soziale Arbeit.' },
  { question: 'Was ist Empowerment in der Sozialen Arbeit?', answer: 'Stärkung der Selbstbestimmung und Handlungsfähigkeit von Klient*innen. Ressourcenorientierter Ansatz: Stärken statt Defizite in den Mittelpunkt stellen.' },
  { question: 'Was ist Case Management?', answer: 'Koordination von Hilfsangeboten für Menschen mit komplexem Hilfebedarf. Phasen: Assessment → Zielvereinbarung → Planung → Durchführung → Monitoring → Evaluation.' },
  { question: 'Was ist der Unterschied zwischen SGB VIII und SGB XII?', answer: 'SGB VIII: Kinder- und Jugendhilfe (bis 27 Jahre). SGB XII: Sozialhilfe für Erwachsene ohne ausreichende eigene Mittel (Grundsicherung im Alter, Hilfe zum Lebensunterhalt etc.).' }
];

const lerngruppen = [
  { name: 'Kinder- und Jugendhilfe Studis', members: 34, icon: '👶', topic: 'SGB VIII, Fallarbeit, Praktika' },
  { name: 'Sozialrecht & SGB', members: 22, icon: '⚖️', topic: 'Sozialgesetzbücher, Leistungsansprüche' },
  { name: 'Sucht & Drogen', members: 18, icon: '🔵', topic: 'Suchtberatung, Harm Reduction, MI' },
  { name: 'Wissenschaftliches Schreiben', members: 41, icon: '✍️', topic: 'Hausarbeiten, Bachelorarbeit, APA' }
];

const mentoren = [
  { name: 'Prof. Dr. Müller', fach: 'Sozialrecht & Sozialpolitik', emoji: '👨‍🏫', verfuegbar: true },
  { name: 'Dipl. Soz.päd. Schmidt', fach: 'Kinder- und Jugendhilfe', emoji: '👩‍🏫', verfuegbar: true },
  { name: 'Prof. Dr. Wagner', fach: 'Sozialarbeitswissenschaft', emoji: '🧑‍🏫', verfuegbar: false },
  { name: 'M.A. Richter', fach: 'Sucht & Gesundheit', emoji: '👩‍⚕️', verfuegbar: true }
];

const ressourcen = [
  { icon: '🏛️', name: 'DBSH', desc: 'Deutscher Berufsverband für Soziale Arbeit – Ethikkodex, Fachpublikationen', link: 'https://www.dbsh.de' },
  { icon: '📖', name: 'SSOAR', desc: 'Kostenlose Open-Access-Literatur zu Sozialwissenschaften', link: 'https://www.ssoar.info' },
  { icon: '🔬', name: 'OpenAlex', desc: '200 Mio+ wissenschaftliche Werke kostenlos durchsuchen', link: 'https://openalex.org' },
  { icon: '🌐', name: 'socialnet.de', desc: 'Fachinformationen, Stellenmarkt und Literaturtipps SA', link: 'https://www.socialnet.de' },
  { icon: '📚', name: 'FIS Bildung', desc: 'Fachinformationssystem Bildung – kostenlose Literaturdatenbank', link: 'https://www.fachportal-paedagogik.de/fis_bildung' },
  { icon: '🏥', name: 'BZgA', desc: 'Bundeszentrale für gesundheitliche Aufklärung – Sucht, Gesundheit', link: 'https://www.bzga.de' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB verbunden');

    await Promise.all([
      LibraryItem.deleteMany({}),
      CaseStudy.deleteMany({}),
      Flashcard.deleteMany({}),
      Group.deleteMany({}),
      Mentor.deleteMany({}),
      Resource.deleteMany({})
    ]);
    console.log('Alte Daten gelöscht');

    await Promise.all([
      LibraryItem.insertMany(bibliothek),
      CaseStudy.insertMany(fallstudien),
      Flashcard.insertMany(karteikarten),
      Group.insertMany(lerngruppen),
      Mentor.insertMany(mentoren),
      Resource.insertMany(ressourcen)
    ]);

    console.log(`✅ Seed erfolgreich:`);
    console.log(`   ${bibliothek.length} Bücher, ${fallstudien.length} Fallstudien, ${karteikarten.length} Karteikarten`);
    console.log(`   ${lerngruppen.length} Lerngruppen, ${mentoren.length} Mentor*innen, ${ressourcen.length} Ressourcen`);
    process.exit(0);
  } catch (err) {
    console.error('Seed-Fehler:', err);
    process.exit(1);
  }
}

seed();
