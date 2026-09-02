import type { AboutSection } from "@/types";

/**
 * About page copy.
 *
 * Tone is museum catalogue: measured, first person, concrete, and not selling
 * anything. Where a section covers ground a journal article covers in depth,
 * it stays at the level of principle and points at the article rather than
 * repeating it.
 */
export const aboutSections: AboutSection[] = [
  {
    id: "about-the-museum",
    number: "01",
    title: "About the Museum",
    navLabel: "The Museum",
    headline: "A private museum, kept in public.",
    body: [
      "Indonesia Wristwatch Museum is a private museum built around a single collection of mechanical watches. It exists online first. There is no building to visit, no opening hours, and for now no plan to pretend otherwise.",
      "What you see here is a selection. The collection behind it is considerably larger and still growing, and most of it is not photographed well enough to show. The pieces that are here have been documented: what they are, what is known about them, what has been done to them, and what has not.",
      "That last part is the actual point. Plenty of places will show you a photograph of a beautiful old watch. Rather fewer will tell you which parts are original, whether the case has been polished, or that the reference number is a guess. A record that leaves those things out is a nice picture, not a record.",
      "The museum is meant to be useful to somebody trying to learn. If you can leave a page knowing one specific thing you did not know before, about how a watch was made or what happened to it afterwards, then it has done its job.",
    ],
    image: "/images/about/about-the-museum.jpg",
    imageAlt:
      "Nine vintage wristwatches on suede blocks inside a wood and glass display case",
  },
  {
    id: "the-beginning",
    number: "02",
    title: "The Beginning",
    navLabel: "The Beginning",
    headline: "It started with a watch that did not work.",
    body: [
      "Not a good watch, and not an interesting one. A steel dress watch from the fifties, bought cheaply and without much thought. It ran for about four hours and then stopped.",
      "Getting it running meant finding somebody who could do the work, and then learning enough to judge whether they had done it properly. That second part turned out to be more absorbing than the watch. Reading led to more reading, then to questions that were probably tedious to answer, and eventually to being able to tell a serviced movement from one that had been rinsed and re-oiled over dirty parts.",
      "Collecting followed from there, slowly and badly at first. The first year produced several pieces bought because the dial was pretty and a few bought because the reference number was one people talked about. Both are ways of letting somebody else decide what you like.",
      "What turned a group of watches into a collection was not a purchase. It was starting to write things down: where each piece came from, what had been done to it, and which parts of its story could actually be verified. A collection is a set of objects plus what is known about them. Without the second half you have a pile.",
    ],
    image: "/images/about/the-beginning.jpg",
    imageAlt:
      "A single aged wristwatch with a worn brown strap resting on a scratched wooden sill beside a window",
    furtherReading: {
      label: "The Passion Behind a Collection",
      href: "/journal/the-passion-behind-a-collection",
    },
  },
  {
    id: "the-collector",
    number: "03",
    title: "The Collector",
    navLabel: "The Collector",
    headline: "The person is not the interesting part.",
    body: [
      "The collector behind this museum is not named here, and that is a decision rather than an oversight. A watch from 1958 is more interesting than whoever happens to be looking after it, and putting a name on the front of it would shift the emphasis in a direction that does not help anybody.",
      "What is worth saying is the nature of the interest. It is mechanical before it is aesthetic. The watches that hold attention longest here are the ones where you can see a workshop solving a problem: a micro-rotor that let a case stay thin, an alarm that strikes a pin on the inside of a case back, a handset redrawn because divers could not read the old one through silt.",
      "Some of the work is done here. Not the difficult work, which goes to people who are properly trained, but enough of the routine to understand what is being asked of them. Having taken a movement apart and put it back together changes the questions you ask a watchmaker, and it makes it much harder for anybody to tell you a watch has been serviced when it has not.",
      "The principles are short. Originality over tidiness. Curiosity over rarity. Write down what you do not know, and do not quietly upgrade a guess into a fact because it would read better.",
    ],
    image: "/images/about/the-collector.jpg",
    imageAlt:
      "A pair of hands holding a wristwatch with its case back removed, movement exposed, a loupe held in the other hand above a tool-strewn bench",
  },
  {
    id: "collection-philosophy",
    number: "04",
    title: "The Collection Philosophy",
    navLabel: "Philosophy",
    headline: "Why a watch ends up here.",
    body: [
      "More than a thousand watches have been selected into this collection, and none of them arrived at random. Each one earns a place against a small set of questions, and there is no expectation that a single watch answers all of them.",
      "Historical significance is the first. Some watches sit at a point where something changed: a movement that made a thinner case possible, a design brief written by a geographical problem, a reference that a navy ordered and then wore into the sea. Craftsmanship is the second, and it is measured by looking rather than by price. Where the finishing stops tells you what a factory expected a customer to notice.",
      "Then design, which means whether the thing still works as an object sixty years on, and mechanical interest, which means whether the movement is doing something worth understanding. Character comes next: the small oddities of a particular example, an unevenly faded bezel or a dial that has aged in a way no reissue has copied honestly. Condition matters, but as originality rather than as polish. A worn, untouched case is worth more here than a sharp refinished one.",
      "Rarity is on the list and it is last. It gets discussed first almost everywhere else, and it is the weakest of the seven, because a great many rare watches are rare for the simple reason that they were not very good and nobody bought them. Two or three of the other questions answered well is usually enough. Rarity on its own is not.",
    ],
    image: "/images/about/collection-philosophy.jpg",
    imageAlt:
      "Six vintage wristwatches laid flat in a row on a pale surface with their straps extended",
  },
  {
    id: "preservation-and-restoration",
    number: "05",
    title: "Preservation & Restoration",
    navLabel: "Preservation",
    headline: "Run it, and otherwise leave it alone.",
    body: [
      "The museum's approach to a watch that arrives needing attention is narrow on purpose. It should run. Beyond that, it should look the way it looked when it came in.",
      "Service is welcome and necessary: strip the movement, clean it, replace what has failed, lubricate it correctly, regulate it, put it back. Where a part has to be replaced, the aim is a period-correct one, and when that proves impossible the substitution is written down rather than quietly absorbed into the record. Every modern part in an old watch is a small amendment to what the watch is, and the number is worth keeping low and known.",
      "Cosmetic work is where we stop. Cases are not polished, because polishing removes metal that does not come back and takes the shape the factory gave the lugs with it. Dials are not refinished, because an original dial carries the printing standards of its decade and a refinished one carries a modern guess about them. Aged lume stays aged, even when it has gone dim and crumbly, because dim original lume is honest and bright new lume on an old dial is a small untruth that gets repeated in every photograph afterwards.",
      "None of this is about preferring damage. It is that scratches, uneven fading and a softened engraving are the record of a watch having been used, and a tidier object with nothing left to say is a worse object.",
    ],
    image: "/images/about/preservation-and-restoration.jpg",
    imageAlt:
      "Hands using a screwdriver on a movement held in a case holder, with a loupe, tweezers, dust blower and case back on the bench",
    furtherReading: {
      label: "When a Watch Needs a Second Life",
      href: "/journal/when-a-watch-needs-a-second-life",
    },
  },
  {
    id: "vision",
    number: "06",
    title: "Vision",
    navLabel: "Vision",
    headline: "What this becomes.",
    body: [
      "Being a digital museum is the current form and not an apology for the absence of a building. A website can show a dial at a magnification no vitrine allows, can be corrected when new information turns up, and can be read by somebody in a city where no collection of this kind exists. Those are real advantages and worth using properly rather than treating the site as a holding pattern.",
      "The immediate work is unglamorous: photograph more of what is already here, verify the entries that rest on assumption, and keep the records honest as the collection grows. Several pieces currently carry attributions that are informed guesses, and they are labelled as such until somebody can do better.",
      "A physical space is possible. It is not promised, and putting a date on it would be the kind of claim this museum is trying not to make. If it happens it will be small, and it will be built so that the objects are legible rather than impressive, which are different goals and easy to confuse.",
      "The longer intention is simpler than a plan. These watches took skill to make, they hold information that exists nowhere else, and there are a finite number of them left in honest condition. Keeping them, documenting them properly, and putting that documentation where people can read it is most of what a museum is for.",
    ],
    image: "/images/about/vision.jpg",
    imageAlt:
      "A long glass vitrine holding nine wristwatches on plinths in a stone-walled gallery interior",
    furtherReading: {
      label: "Why We Keep Old Watches",
      href: "/journal/why-we-keep-old-watches",
    },
  },
];

export const aboutIntro = {
  headline: "About",
  lede: "A private museum built around one collection of mechanical watches, and an account of how it is put together.",
};

export default aboutSections;
