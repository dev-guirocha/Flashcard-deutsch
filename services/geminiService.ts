import { GoogleGenAI, Type } from "@google/genai";
import type { Category } from '../types';

const flashcardSchema = {
  type: Type.OBJECT,
  properties: {
    germanWord: { type: Type.STRING, description: "A single German word or a very short phrase." },
    englishTranslation: { type: Type.STRING, description: "The English translation of the German word." },
    germanSentence: { type: Type.STRING, description: "An example sentence in German using the word." },
    englishSentenceTranslation: { type: Type.STRING, description: "The English translation of the example sentence." },
  },
  required: ["germanWord", "englishTranslation", "germanSentence", "englishSentenceTranslation"],
};

const categorySchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The name of the vocabulary category (e.g., 'Greetings')." },
    flashcards: {
      type: Type.ARRAY,
      items: flashcardSchema,
      description: "A list of flashcards for this category."
    },
  },
  required: ["name", "flashcards"],
};

const mainSchema = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      items: categorySchema,
      description: "A list of vocabulary categories."
    },
  },
  required: ["categories"],
};

const vocabularyList = `
der;the (masculine);article
die;the (feminine/plural);article
das;the (neuter);article
ein;a, an (masculine/neuter);article
eine;a, an (feminine);article
kein;no, not any;article
meine;my (feminine/plural);pronoun
mein;my (masculine/neuter);pronoun
dein;your (informal, masc./neut.);pronoun
deine;your (informal, fem./pl.);pronoun
sein;his, its;pronoun
seine;his (feminine/plural);pronoun
ihr;her, their, your (formal);pronoun
ihre;her, their (feminine/plural);pronoun
unser;our (masculine/neuter);pronoun
unsere;our (feminine/plural);pronoun
dieser;this (masculine);pronoun
diese;this (feminine/plural);pronoun
dieses;this (neuter);pronoun
jeder;every, each;pronoun
man;one, people;pronoun
wer;who;pronoun
was;what;pronoun
welcher;which;pronoun
jemand;someone;pronoun
niemand;no one;pronoun
etwas;something;pronoun
nichts;nothing;pronoun
ich;I;pronoun
du;you (informal singular);pronoun
er;he;pronoun
sie;she, they;pronoun
es;it;pronoun
wir;we;pronoun
ihr;you (informal plural);pronoun
Sie;you (formal);pronoun
mich;me (accusative);pronoun
mir;me (dative);pronoun
dich;you (accusative informal);pronoun
dir;you (dative informal);pronoun
ihn;him (accusative);pronoun
ihm;him (dative);pronoun
uns;us;pronoun
euch;you (plural);pronoun
sich;oneself, himself, herself;pronoun
dies;this;pronoun
jenes;that;pronoun
solch;such;pronoun
alle;all;pronoun
beide;both;pronoun
andere;other;pronoun
mehr;more;quantifier
weniger;less;quantifier
viele;many;quantifier
einige;some;quantifier
mehrere;several;quantifier
alles;everything;pronoun
dass;that (conjunction);conjunction
weil;because;conjunction
wenn;if, when;conjunction
ob;whether;if;conjunction
und;and;conjunction
oder;or;conjunction
aber;but;conjunction
denn;for, because;conjunction
doch;yet, still;conjunction
sondern;but rather;conjunction
trotzdem;nevertheless;conjunction
deshalb;therefore;conjunction
damit;so that;conjunction
also;so, thus;conjunction
sowie;as well as;conjunction
bevor;before;conjunction
nachdem;after;conjunction
seit;since;preposition
bis;until, to;preposition
mit;with;preposition
ohne;without;preposition
für;for;preposition
von;from, of;preposition
zu;to;preposition
nach;after, to;preposition
an;at, on;preposition
auf;on, upon;preposition
in;in;preposition
unter;under;preposition
über;over, about;preposition
zwischen;between;preposition
hinter;behind;preposition
vor;before, in front of;preposition
gegen;against;preposition
neben;next to;preposition
bei;at, near;preposition
durch;through;preposition
während;during;preposition
trotz;despite;preposition
entlang;along;preposition
außer;except;preposition
innerhalb;within;preposition
außerhalb;outside;preposition
oberhalb;above;preposition
unterhalb;below;preposition
gegenüber;opposite;preposition
heute;today;adverb
gestern;yesterday;adverb
morgen;tomorrow;adverb
immer;always;adverb
nie;never;adverb
manchmal;sometimes;adverb
oft;often;adverb
selten;rarely;adverb
jetzt;now;adverb
bald;soon;adverb
dann;then;adverb
später;later;adverb
früh;early;adverb
hier;here;adverb
dort;there;adverb
überall;everywhere;adverb
nirgendwo;nowhere;adverb
oben;above;adverb
unten;below;adverb
drinnen;inside;adverb
draußen;outside;adverb
links;left;adverb
rechts;right;adverb
zurück;back;adverb
weiter;further;adverb
vielleicht;maybe;adverb
wahrscheinlich;probably;adverb
sicher;surely;adverb
wirklich;really;adverb
genau;exactly;adverb
ungefähr;approximately;adverb
fast;almost;adverb
gerade;just, exactly;adverb
schon;already;adverb
noch;still, yet;adverb
nicht;not;particle
kein;no;particle
auch;also;particle
nur;only;particle
mal;once;particle
ja;yes;particle
nein;no;particle
wohl;probably;particle
eben;just;particle
halt;just;particle
etwa;about;particle
sogar;even;particle
bereits;already;adverb
endlich;finally;adverb
so;so;adverb
sehr;very;adverb
zu;too;adverb
viel;much;adverb
sein;to be;verb
haben;to have;verb
werden;to become;verb
können;can, to be able to;verb
müssen;must, to have to;verb
sagen;to say;verb
machen;to do, to make;verb
geben;to give;verb
kommen;to come;verb
gehen;to go;verb
wissen;to know (a fact);verb
sehen;to see;verb
lassen;to let, to allow;verb
stehen;to stand;verb
finden;to find;verb
bleiben;to stay;verb
liegen;to lie (be located);verb
heißen;to be called;verb
denken;to think;verb
nehmen;to take;verb
tun;to do;verb
dürfen;may, to be allowed to;verb
glauben;to believe;verb
halten;to hold, to stop;verb
nennen;to name, to call;verb
mögen;to like;verb
zeigen;to show;verb
führen;to lead;verb
sprechen;to speak;verb
bringen;to bring;verb
leben;to live;verb
fahren;to drive, to go (by vehicle);verb
meinen;to mean, to think;verb
fragen;to ask;verb
kennen;to know (a person);verb
gelten;to apply, to be valid;verb
arbeiten;to work;verb
spielen;to play;verb
folgen;to follow;verb
lernen;to learn;verb
bestehen;to exist, to pass (an exam);verb
verstehen;to understand;verb
setzen;to set, to put;verb
bekommen;to get, to receive;verb
beginnen;to begin;verb
erzählen;to tell, to narrate;verb
versuchen;to try;verb
schreiben;to write;verb
laufen;to run;verb
erklären;to explain;verb
entsprechen;to correspond;verb
sitzen;to sit;verb
ziehen;to pull, to move;verb
scheinen;to seem, to shine;verb
fallen;to fall;verb
gehören;to belong;verb
entstehen;to arise, to develop;verb
erhalten;to receive;verb
treffen;to meet;verb
suchen;to search, to look for;verb
legen;to lay, to put down;verb
vorstellen;to introduce, to imagine;verb
handeln;to act, to deal;verb
erkennen;to recognize;verb
entwickeln;to develop;verb
reden;to talk;verb
aussehen;to look, to appear;verb
erscheinen;to appear;verb
bilden;to form;verb
anfangen;to begin;verb
erwarten;to expect;verb
wohnen;to live, to reside;verb
betreffen;to concern;verb
warten;to wait;verb
vergehen;to pass (time);verb
helfen;to help;verb
gewinnen;to win;verb
schließen;to close;verb
fühlen;to feel;verb
bieten;to offer;verb
interessieren;to interest;verb
erinnern;to remember;verb
erreichen;to reach;verb
tragen;to carry, to wear;verb
schaffen;to manage, to create;verb
lesen;to read;verb
verlieren;to lose;verb
darstellen;to depict, to portray;verb
ergeben;to result in;verb
anbieten;to offer;verb
studieren;to study;verb
trinken;to drink;verb
essen;to eat;verb
kaufen;to buy;verb
verkaufen;to sell;verb
brauchen;to need;verb
reisen;to travel;verb
schlafen;to sleep;verb
stellen;to place;verb
hören;to hear;verb
schauen;to look;verb
fliegen;to fly;verb
vergessen;to forget;verb
lieben;to love;verb
hassen;to hate;verb
hoffen;to hope;verb
sterben;to die;verb
geboren werden;to be born;verb
enden;to end;verb
öffnen;to open;verb
zurückkommen;to come back;verb
weggehen;to go away;verb
mitkommen;to come along;verb
aufstehen;to get up;verb
aufhören;to stop;verb
weitergehen;to continue;verb
antworten;to answer;verb
der Mensch;person, human;noun
die Zeit;time;noun
das Jahr;year;noun
der Tag;day;noun
die Woche;week;noun
der Monat;month;noun
das Leben;life;noun
die Hand;hand;noun
das Auge;eye;noun
das Ohr;ear;noun
der Mund;mouth;noun
die Nase;nose;noun
der Kopf;head;noun
das Gesicht;face;noun
der Körper;body;noun
der Arm;arm;noun
das Bein;leg;noun
der Fuß;foot;noun
das Herz;heart;noun
der Freund;friend (male);noun
die Freundin;friend (female);noun
die Familie;family;noun
die Mutter;mother;noun
der Vater;father;noun
der Bruder;brother;noun
die Schwester;sister;noun
das Kind;child;noun
der Sohn;son;noun
die Tochter;daughter;noun
der Mann;man;noun
die Frau;woman;noun
die Leute;people;noun
der Name;name;noun
der Ort;place;noun
die Stadt;city;noun
das Dorf;village;noun
das Land;country;noun
die Welt;world;noun
das Haus;house;noun
die Wohnung;apartment;noun
das Zimmer;room;noun
die Küche;kitchen;noun
das Bad;bathroom;noun
das Bett;bed;noun
der Tisch;table;noun
der Stuhl;chair;noun
die Tür;door;noun
das Fenster;window;noun
die Wand;wall;noun
die Decke;ceiling, blanket;noun
der Boden;floor, ground;noun
die Straße;street;noun
die Arbeit;work;noun
der Beruf;job, profession;noun
die Schule;school;noun
die Universität;university;noun
der Lehrer;teacher (male);noun
die Lehrerin;teacher (female);noun
der Schüler;student (male, school);noun
die Schülerin;student (female, school);noun
der Student;student (male, university);noun
die Studentin;student (female, university);noun
der Arzt;doctor (male);noun
die Ärztin;doctor (female);noun
das Krankenhaus;hospital;noun
die Apotheke;pharmacy;noun
der Laden;shop;noun
das Geschäft;store;noun
der Supermarkt;supermarket;noun
das Geld;money;noun
die Bank;bank;noun
der Euro;Euro (currency);noun
die Rechnung;bill;noun
der Preis;price;noun
das Problem;problem;noun
die Frage;question;noun
die Antwort;answer;noun
die Sache;thing;noun
das Ding;thing;noun
der Platz;place, square;noun
der Weg;way, path;noun
die Brücke;bridge;noun
der Park;park;noun
der Garten;garden;noun
der Baum;tree;noun
die Blume;flower;noun
das Wasser;water;noun
der See;lake;noun
das Meer;sea;noun
der Berg;mountain;noun
das Tal;valley;noun
die Sonne;sun;noun
der Mond;moon;noun
der Stern;star;noun
der Himmel;sky;noun
die Wolke;cloud;noun
der Regen;rain;noun
der Schnee;snow;noun
der Wind;wind;noun
das Wetter;weather;noun
die Temperatur;temperature;noun
der Sommer;summer;noun
der Winter;winter;noun
der Frühling;spring;noun
der Herbst;autumn;noun
der Morgen;morning;noun
der Abend;evening;noun
die Nacht;night;noun
der Mittag;noon;noun
die Stunde;hour;noun
die Minute;minute;noun
die Sekunde;second;noun
der Anfang;beginning;noun
das Ende;end;noun
das Beispiel;example;noun
der Fall;case;noun
der Grund;reason;noun
die Art;kind, type;noun
die Weise;way, manner;noun
die Seite;page, side;noun
das Buch;book;noun
die Zeitung;newspaper;noun
das Heft;notebook;noun
der Brief;letter;noun
die Sprache;language;noun
das Wort;word;noun
der Satz;sentence;noun
die Stimme;voice;noun
der Ton;sound, tone;noun
das Lied;song;noun
die Musik;music;noun
der Film;film;noun
das Bild;picture, image;noun
die Farbe;color;noun
die Form;shape, form;noun
die Linie;line;noun
der Punkt;point;noun
das Licht;light;noun
der Schatten;shadow;noun
der Moment;moment;noun
die Zukunft;future;noun
die Vergangenheit;past;noun
die Gegenwart;present;noun
die Richtung;direction;noun
die Position;position;noun
der Raum;space, room;noun
die Nähe;proximity;noun
die Entfernung;distance;noun
die Zahl;number;noun
die Nummer;number;noun
die Menge;amount;noun
das Stück;piece;noun
das Paar;pair;noun
das Ziel;goal;noun
die Chance;chance;noun
das Ergebnis;result;noun
der Erfolg;success;noun
die Erfahrung;experience;noun
der Versuch;attempt;noun
der Fehler;mistake;noun
die Idee;idea;noun
der Gedanke;thought;noun
der Traum;dream;noun
die Hoffnung;hope;noun
die Angst;fear;noun
die Freude;joy;noun
der Spaß;fun;noun
die Liebe;love;noun
der Hass;hate;noun
der Hunger;hunger;noun
der Durst;thirst;noun
die Gesundheit;health;noun
die Krankheit;illness;noun
der Schmerz;pain;noun
die Haut;skin;noun
der Rücken;back;noun
der Bauch;belly;noun
das Blut;blood;noun
der Finger;finger;noun
das Haar;hair;noun
das Auto;car;noun
der Bus;bus;noun
der Zug;train;noun
das Flugzeug;airplane;noun
das Fahrrad;bicycle;noun
die Kreuzung;crossing;noun
die Haltestelle;stop (bus/train);noun
der Bahnhof;train station;noun
der Flughafen;airport;noun
das Schiff;ship;noun
das Boot;boat;noun
der Verkehr;traffic;noun
die Fahrt;trip, journey;noun
der Fahrer;driver (male);noun
die Fahrerin;driver (female);noun
das Ticket;ticket;noun
die Karte;map, card;noun
der Pass;passport;noun
der Tunnel;tunnel;noun
der Markt;market;noun
das Einkaufszentrum;shopping mall;noun
das Restaurant;restaurant;noun
das Café;café;noun
die Bäckerei;bakery;noun
die Polizei;police;noun
das Büro;office;noun
die Firma;company;noun
die Fabrik;factory;noun
die Post;post office;noun
das Kino;cinema;noun
das Theater;theater;noun
das Museum;museum;noun
die Kirche;church;noun
die Moschee;mosque;noun
die Bibliothek;library;noun
das Gebäude;building;noun
der Fluss;river;noun
der Wald;forest;noun
die Pflanze;plant;noun
das Tier;animal;noun
der Hund;dog;noun
die Katze;cat;noun
das Pferd;horse;noun
die Kuh;cow;noun
das Schwein;pig;noun
das Schaf;sheep;noun
das Huhn;chicken;noun
der Vogel;bird;noun
der Fisch;fish;noun
die Maus;mouse;noun
die Ratte;rat;noun
der Elefant;elephant;noun
der Löwe;lion;noun
der Bär;bear;noun
der Affe;monkey;noun
der Tiger;tiger;noun
der Wolf;wolf;noun
der Fuchs;fox;noun
das Insekt;insect;noun
die Biene;bee;noun
die Fliege;fly;noun
die Mücke;mosquito;noun
die Spinne;spider;noun
das Blatt;leaf;noun
die Wurzel;root;noun
das Gras;grass;noun
die Erde;earth, soil;noun
der Stein;stone;noun
das Feuer;fire;noun
die Luft;air;noun
die Jahreszeit;season;noun
das Essen;food;noun
das Getränk;drink;noun
das Brot;bread;noun
die Butter;butter;noun
der Käse;cheese;noun
das Fleisch;meat;noun
das Obst;fruit;noun
das Gemüse;vegetable;noun
die Kartoffel;potato;noun
der Apfel;apple;noun
die Orange;orange;noun
die Banane;banana;noun
die Tomate;tomato;noun
die Zwiebel;onion;noun
der Salat;salad;noun
das Ei;egg;noun
der Kuchen;cake;noun
der Zucker;sugar;noun
das Salz;salt;noun
der Pfeffer;pepper;noun
der Saft;juice;noun
der Kaffee;coffee;noun
der Tee;tea;noun
das Bier;beer;noun
der Wein;wine;noun
die Milch;milk;noun
das Frühstück;breakfast;noun
das Mittagessen;lunch;noun
das Abendessen;dinner;noun
die Mahlzeit;meal;noun
die Kleidung;clothing;noun
das Hemd;shirt;noun
die Hose;pants;noun
das Kleid;dress;noun
der Rock;skirt;noun
die Jacke;jacket;noun
der Mantel;coat;noun
der Schuh;shoe;noun
die Socke;sock;noun
der Hut;hat;noun
die Mütze;cap;noun
der Anzug;suit;noun
die Bluse;blouse;noun
die Tasche;bag;noun
die Brille;glasses;noun
die Uhr;watch;noun
der Ring;ring;noun
die Kette;necklace;noun
das Handy;mobile phone;noun
der Computer;computer;noun
das Internet;internet;noun
die E-Mail;email;noun
die Webseite;website;noun
die Nachricht;message;noun
der Text;text;noun
das Gespräch;conversation;noun
das Telefon;telephone;noun
die Adresse;address;noun
die Postleitzahl;postal code;noun
das Konto;account;noun
der Job;job;noun
der Chef;boss;noun
der Kollege;colleague;noun
das Projekt;project;noun
der Termin;appointment;noun
die Pause;break;noun
der Urlaub;vacation;noun
die Freizeit;free time;noun
das Hobby;hobby;noun
der Sport;sport;noun
das Spiel;game;noun
die Mannschaft;team;noun
der Ball;ball;noun
der Sieg;victory;noun
die Niederlage;defeat;noun
die Kunst;art;noun
das Konzert;concert;noun
das Magazin;magazine;noun
das Fernsehen;television;noun
die Sendung;show;noun
der Bericht;report;noun
das Interview;interview;noun
gut;good;adjective
schlecht;bad;adjective
neu;new;adjective
alt;old;adjective
jung;young;adjective
groß;big, tall;adjective
klein;small, little;adjective
lang;long;adjective
kurz;short;adjective
hoch;high, tall;adjective
niedrig;low;adjective
breit;wide;adjective
eng;narrow;adjective
stark;strong;adjective
schwach;weak;adjective
schnell;fast;adjective
langsam;slow;adjective
heiß;hot;adjective
kalt;cold;adjective
warm;warm;adjective
kühl;cool;adjective
teuer;expensive;adjective
billig;cheap;adjective
reich;rich;adjective
arm;poor;adjective
schwer;heavy;adjective
leicht;light, easy;adjective
einfach;simple;adjective
kompliziert;complex;adjective
sauber;clean;adjective
schmutzig;dirty;adjective
hell;bright;adjective
dunkel;dark;adjective
laut;loud;adjective
leise;quiet;adjective
freundlich;friendly;adjective
unfreundlich;unfriendly;adjective
glücklich;happy;adjective
traurig;sad;adjective
müde;tired;adjective
wach;awake;adjective
krank;sick;adjective
gesund;healthy;adjective
hungrig;hungry;adjective
durstig;thirsty;adjective
nass;wet;adjective
trocken;dry;adjective
scharf;spicy, sharp;adjective
weich;soft;adjective
hart;hard;adjective
leer;empty;adjective
voll;full;adjective
interessant;interesting;adjective
langweilig;boring;adjective
wichtig;important;adjective
unwichtig;unimportant;adjective
richtig;correct;adjective
falsch;wrong;adjective
möglich;possible;adjective
unmöglich;impossible;adjective
frei;free;adjective
besetzt;occupied;adjective
bereit;ready;adjective
fertig;done;adjective
gleich;same, equal;adjective
anders;different;adjective
schön;beautiful, nice;adjective
hässlich;ugly;adjective
nett;nice, kind;adjective
böse;angry, evil;adjective
ruhig;calm;adjective
nervös;nervous;adjective
klug;smart;adjective
dumm;stupid;adjective
stolz;proud;adjective
fleißig;hard-working;adjective
faul;lazy;adjective
vorsichtig;careful;adjective
gefährlich;dangerous;adjective
sicher;safe, certain;adjective
unsicher;uncertain;adjective
nah;near;adjective
fern;far;adjective
offen;open;adjective
geschlossen;closed;adjective
spät;late;adjective
modern;modern;adjective
altmodisch;old-fashioned;adjective
normal;normal;adjective
besonders;special;adjective
verschieden;different;adjective
ähnlich;similar;adjective
schwer;difficult;adjective
einfach;easy;adjective
weit;far;adjective
tief;deep;adjective
lieb;kind;adjective
gemein;mean;adjective
gern;gladly;adverb
selten;seldom;adverb
immer noch;still;adverb
oftmals;frequently;adverb
zusammen;together;adverb
allein;alone;adverb
wieder;again;adverb
ganz;completely;adverb
um;around;preposition
wegen;because of;preposition
ab;from;preposition
entgegen;contrary to;preposition
dank;thanks to;preposition
anstatt;instead of;preposition
laut;according to;preposition
gemäß;according to;preposition
mithilfe;with the help of;preposition
falls;if;conjunction
obwohl;although;conjunction
seitdem;since then;conjunction
sobald;as soon as;conjunction
solange;as long as;conjunction
indem;by (doing something);conjunction
je... desto;the... the (comparative);conjunction
entweder... oder;either... or;conjunction
weder... noch;neither... nor;conjunction
nicht nur... sondern auch;not only... but also;conjunction
wie;as, like;conjunction
als;than, when;conjunction
da;since, because;conjunction
obgleich;although;conjunction
damals;back then;adverb
deswegen;for that reason;adverb
darum;therefore;adverb
danach;after that;adverb
davor;before that;adverb
zuerst;first;adverb
dannach;afterwards;adverb
sofort;immediately;adverb
vorher;beforehand;adverb
nachher;afterwards;adverb
übermorgen;the day after tomorrow;adverb
vorgestern;the day before yesterday;adverb
sicherlich;surely;adverb
bestimmt;certainly;adverb
eventuell;possibly;adverb
kaum;hardly;adverb
besonders;especially;adverb
leider;unfortunately;adverb
glücklicherweise;fortunately;adverb
natürlich;of course;adverb
zum Beispiel;for example;expression
auf jeden Fall;definitely;expression
auf keinen Fall;by no means;expression
im Moment;at the moment;expression
am Ende;in the end;expression
auf einmal;all at once;expression
guten Morgen;good morning;expression
guten Tag;good day;expression
guten Abend;good evening;expression
gute Nacht;good night;expression
bitte;please;expression
danke;thank you;expression
vielen Dank;many thanks;expression
gern geschehen;you’re welcome;expression
entschuldigung;excuse me, sorry;expression
kein Problem;no problem;expression
wie geht’s;how are you;expression
mir geht’s gut;I’m fine;expression
ich weiß nicht;I don’t know;expression
keine Ahnung;no idea;expression
wirklich;really;expression
stimmt;that’s right;expression
na klar;sure;expression
kein Thema;no worries;expression
bis bald;see you soon;expression
bis später;see you later;expression
tschüss;bye;expression
auf Wiedersehen;goodbye;expression
`;

export const generateFlashcardData = async (): Promise<Category[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are an expert German language tutor. Your task is to generate a structured JSON object for a German vocabulary flashcard application.
    Use the following list of words, which are provided in "germanWord;englishTranslation;category" format. For each item in the list, you must create a simple and clear German example sentence ('germanSentence') and its corresponding English translation ('englishSentenceTranslation').
    Group the resulting flashcards into their respective categories as specified in the list. The final JSON output must strictly adhere to the provided schema.

    Here is the list of words to use:
    ${vocabularyList}

    The final JSON object must have a root key 'categories'. The value of 'categories' should be an array of category objects. Each category object must have a 'name' (string, from the provided list) and a 'flashcards' property (an array of flashcard objects). Each flashcard object must contain: 'germanWord', 'englishTranslation', 'germanSentence', and 'englishSentenceTranslation'. Ensure that words with the same category are grouped under a single category object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mainSchema,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);

    if (data && Array.isArray(data.categories)) {
      // De-duplicate verbs and other categories
      const categoryMap = new Map<string, Category>();
      (data.categories as Category[]).forEach(category => {
          if (categoryMap.has(category.name)) {
              const existingCategory = categoryMap.get(category.name)!;
              const uniqueFlashcards = new Map<string, typeof category.flashcards[0]>();
              
              existingCategory.flashcards.forEach(fc => uniqueFlashcards.set(fc.germanWord, fc));
              category.flashcards.forEach(fc => uniqueFlashcards.set(fc.germanWord, fc));

              existingCategory.flashcards = Array.from(uniqueFlashcards.values());

          } else {
              categoryMap.set(category.name, category);
          }
      });

      return Array.from(categoryMap.values());
    } else {
      console.error("Invalid data structure received:", data);
      throw new Error("Failed to parse flashcard data from API response.");
    }
  } catch (error) {
    console.error("Error generating flashcard data:", error);
    throw new Error("Could not generate flashcard data. Please check the API key and network connection.");
  }
};
