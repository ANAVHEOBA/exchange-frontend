import { createSignal } from 'solid-js';

const [appLocale, setAppLocaleSignal] = createSignal('en');

const messages = {
  en: {
    header: {
      howItWorks: 'How it works',
      faq: 'FAQ',
      contact: 'Contact',
      selectLanguage: 'Select language',
      language: 'Language',
      chooseLanguage: 'Choose interface language',
      openAccountMenu: 'Open account menu',
      login: 'Login',
      about: 'About',
    },
    hero: {
      titleLead: 'Swap any volume.',
      titleAccent: 'Be private.',
      description: 'Unleash Crypto Freedom: Limitless, Trustworthy, and Sign-Up Free',
    },
    guide: {
      kicker: 'How It Works',
      title: 'Simple routes. Reliable partners. Clear next steps.',
      summary:
        'The section below explains the trust model, the extra tools around swaps, and the exact three-step flow a user follows from quote discovery to final delivery.',
      cta: 'Start exchange',
      highlightOneEyebrow: 'Simple and Reliable',
      highlightOneTitle: 'Best-rate routing without touching your funds.',
      highlightOneDescription:
        'At no extra cost, we find the best rates and redirect your order to known and reliable instant exchanges. We do not interfere with your transaction, and we never have access to your funds.',
      highlightOnePointOne: 'No custody',
      highlightOnePointTwo: 'Known exchange partners',
      highlightOnePointThree: 'Support when a transaction needs help',
      highlightTwoEyebrow: 'Amazing Crypto Tools',
      highlightTwoTitle: 'A wider crypto toolkit in one place.',
      highlightTwoDescription:
        'Swap into your preferred assets, compare live routes quickly, and use connected services like prepaid cards and gift cards without bouncing between separate products.',
      highlightTwoPointOne: 'Swaps',
      highlightTwoPointTwo: 'Live route comparison',
      highlightTwoPointThree: 'Prepaid and gift card flows',
      stepsKicker: 'Swap In 3 Simple Steps',
      stepsTitle: 'From quote to payout without the guesswork.',
      stepOneTitle: 'Build your route',
      stepOneDescription:
        'Choose the two assets, enter the amount you want to send, and start the exchange. The platform checks the market and gathers live quotes for you.',
      stepTwoTitle: 'Pick the rate',
      stepTwoDescription:
        'Compare the available options, choose your preferred rate, then enter the wallet address where you want to receive funds. For multi-network coins, confirm the correct network before continuing.',
      stepThreeTitle: 'Send and track',
      stepThreeDescription:
        'We generate the deposit address and exact amount to send. Complete the transfer from your wallet, then follow the status on the same screen until the destination crypto arrives.',
    },
    about: {
      eyebrow: 'About Assetar',
      title: 'Private swap routing with a hosted donation flow.',
      copyOne:
        'Assetar compares live swap providers, surfaces the routes that are actually available, and keeps the execution flow non-custodial from quote discovery through settlement.',
      copyTwo:
        'The donation flow uses a server-controlled target wallet. Donors only choose the asset they want to send, the provider they prefer, and the amount. The selected provider then settles directly to the hosted donation address configured on the backend.',
      badgeOne: 'Non-custodial routing',
      badgeTwo: 'Hosted donation target',
      badgeThree: 'Live provider comparison',
      supportLabel: 'Support',
      generalLabel: 'General',
      donationAddress: 'Hosted donation address',
      donationAddressLoading: 'Loading current donation target...',
      whyKicker: 'Why Assetar',
      whyTitle: 'A cleaner route from donor intent to settled payout.',
      whyCardOneTitle: 'Simple and reliable',
      whyCardOneCopy:
        'At no extra cost, Assetar compares live partner routes so donors can choose a provider with clear pricing, visible payout estimates, and a non-custodial settlement flow.',
      whyCardTwoTitle: 'Amazing crypto tools',
      whyCardTwoCopy:
        'Swap discovery, hosted donations, recipient validation, and live status tracking all stay inside the same interface so donors move from quote to settlement without juggling multiple dashboards.',
      stepsKicker: 'How It Works',
      stepsTitle: 'Swap in 3 simple steps.',
      stepOneTitle: 'Choose the asset you want to send',
      stepOneCopy:
        'Pick the coin and network you want to send, set the amount, and let Assetar query live partner routes for the hosted donation target.',
      stepTwoTitle: 'Select the route that fits',
      stepTwoCopy:
        'Review floating and fixed quotes, compare providers, and choose the route that fits your timing and expected receive amount.',
      stepThreeTitle: 'Send once and track live',
      stepThreeCopy:
        'Create the checkout, send the deposit once, and keep the status page open to follow confirmations, expiry, and provider updates in real time.',
    },
  },
  el: {
    header: {
      howItWorks: 'Πώς λειτουργεί',
      faq: 'Συχνές ερωτήσεις',
      contact: 'Επικοινωνία',
      selectLanguage: 'Επιλογή γλώσσας',
      language: 'Γλώσσα',
      chooseLanguage: 'Επιλέξτε γλώσσα διεπαφής',
      openAccountMenu: 'Άνοιγμα μενού λογαριασμού',
      login: 'Σύνδεση',
      about: 'Σχετικά',
    },
    hero: {
      titleLead: 'Αντάλλαξε οποιονδήποτε όγκο.',
      titleAccent: 'Μείνε ιδιωτικός.',
      description: 'Ελευθερία στα crypto: χωρίς όρια, αξιόπιστα και χωρίς εγγραφή.',
    },
    guide: {
      kicker: 'Πώς λειτουργεί',
      title: 'Απλές διαδρομές. Αξιόπιστοι συνεργάτες. Καθαρά επόμενα βήματα.',
      summary:
        'Η παρακάτω ενότητα εξηγεί το μοντέλο εμπιστοσύνης, τα επιπλέον εργαλεία γύρω από τα swaps και την ακριβή ροή τριών βημάτων από την αναζήτηση προσφοράς μέχρι την τελική παράδοση.',
      cta: 'Έναρξη ανταλλαγής',
      highlightOneEyebrow: 'Απλό και αξιόπιστο',
      highlightOneTitle: 'Βέλτιστη δρομολόγηση χωρίς να αγγίζουμε τα κεφάλαιά σας.',
      highlightOneDescription:
        'Χωρίς επιπλέον κόστος, βρίσκουμε τις καλύτερες τιμές και δρομολογούμε την εντολή σας σε γνωστά και αξιόπιστα instant exchanges. Δεν παρεμβαίνουμε στη συναλλαγή σας και δεν έχουμε ποτέ πρόσβαση στα κεφάλαιά σας.',
      highlightOnePointOne: 'Χωρίς custody',
      highlightOnePointTwo: 'Γνωστοί συνεργάτες ανταλλακτηρίων',
      highlightOnePointThree: 'Υποστήριξη όταν μια συναλλαγή χρειάζεται βοήθεια',
      highlightTwoEyebrow: 'Ισχυρά crypto εργαλεία',
      highlightTwoTitle: 'Ένα ευρύτερο crypto toolkit σε ένα μέρος.',
      highlightTwoDescription:
        'Κάντε swap στα assets που προτιμάτε, συγκρίνετε ζωντανές διαδρομές γρήγορα και χρησιμοποιήστε συνδεδεμένες υπηρεσίες όπως prepaid cards και gift cards χωρίς να πηδάτε ανάμεσα σε ξεχωριστά προϊόντα.',
      highlightTwoPointOne: 'Swaps',
      highlightTwoPointTwo: 'Σύγκριση live routes',
      highlightTwoPointThree: 'Prepaid και gift card ροές',
      stepsKicker: 'Swap σε 3 απλά βήματα',
      stepsTitle: 'Από την προσφορά μέχρι την πληρωμή χωρίς αβεβαιότητα.',
      stepOneTitle: 'Χτίσε τη διαδρομή σου',
      stepOneDescription:
        'Διάλεξε τα δύο assets, βάλε το ποσό που θέλεις να στείλεις και ξεκίνα την ανταλλαγή. Η πλατφόρμα ελέγχει την αγορά και συγκεντρώνει live προσφορές για εσένα.',
      stepTwoTitle: 'Διάλεξε την τιμή',
      stepTwoDescription:
        'Σύγκρινε τις διαθέσιμες επιλογές, διάλεξε την προτιμώμενη τιμή σου και μετά βάλε τη διεύθυνση πορτοφολιού όπου θέλεις να λάβεις τα χρήματα. Για νομίσματα πολλαπλών δικτύων, επιβεβαίωσε το σωστό δίκτυο πριν συνεχίσεις.',
      stepThreeTitle: 'Στείλε και παρακολούθησε',
      stepThreeDescription:
        'Δημιουργούμε τη διεύθυνση κατάθεσης και το ακριβές ποσό προς αποστολή. Ολοκλήρωσε τη μεταφορά από το πορτοφόλι σου και παρακολούθησε την κατάσταση στην ίδια οθόνη μέχρι να φτάσει το crypto προορισμού.',
    },
    about: {
      eyebrow: 'Σχετικά με το Assetar',
      title: 'Ιδιωτική δρομολόγηση swaps με hosted donation flow.',
      copyOne:
        'Το Assetar συγκρίνει live swap providers, εμφανίζει τις διαδρομές που είναι πραγματικά διαθέσιμες και κρατά τη ροή εκτέλεσης μη θεματοφυλακτική από την αναζήτηση προσφοράς μέχρι τον διακανονισμό.',
      copyTwo:
        'Η ροή δωρεάς χρησιμοποιεί ένα server-controlled target wallet. Οι δωρητές επιλέγουν μόνο το asset που θέλουν να στείλουν, τον provider που προτιμούν και το ποσό. Ο επιλεγμένος provider διακανονίζει απευθείας στη hosted donation address που είναι ρυθμισμένη στο backend.',
      badgeOne: 'Μη θεματοφυλακτική δρομολόγηση',
      badgeTwo: 'Hosted donation target',
      badgeThree: 'Live σύγκριση providers',
      supportLabel: 'Υποστήριξη',
      generalLabel: 'Γενικά',
      donationAddress: 'Hosted donation address',
      donationAddressLoading: 'Φόρτωση τρέχοντος donation target...',
      whyKicker: 'Γιατί Assetar',
      whyTitle: 'Μια καθαρότερη διαδρομή από την πρόθεση δωρεάς στον τελικό διακανονισμό.',
      whyCardOneTitle: 'Απλό και αξιόπιστο',
      whyCardOneCopy:
        'Χωρίς επιπλέον κόστος, το Assetar συγκρίνει live partner routes ώστε οι δωρητές να επιλέγουν provider με καθαρή τιμολόγηση, ορατές εκτιμήσεις payout και μη θεματοφυλακτική ροή διακανονισμού.',
      whyCardTwoTitle: 'Ισχυρά crypto εργαλεία',
      whyCardTwoCopy:
        'Η αναζήτηση swaps, οι hosted donations, το recipient validation και το live status tracking μένουν στην ίδια διεπαφή ώστε οι δωρητές να πηγαίνουν από την προσφορά στον διακανονισμό χωρίς να αλλάζουν dashboards.',
      stepsKicker: 'Πώς λειτουργεί',
      stepsTitle: 'Swap σε 3 απλά βήματα.',
      stepOneTitle: 'Διάλεξε το asset που θέλεις να στείλεις',
      stepOneCopy:
        'Διάλεξε το coin και το δίκτυο που θέλεις να στείλεις, όρισε το ποσό και άφησε το Assetar να ζητήσει live partner routes για το hosted donation target.',
      stepTwoTitle: 'Διάλεξε τη διαδρομή που ταιριάζει',
      stepTwoCopy:
        'Δες floating και fixed quotes, σύγκρινε providers και διάλεξε τη διαδρομή που ταιριάζει στον χρόνο και στο αναμενόμενο ποσό λήψης.',
      stepThreeTitle: 'Στείλε μία φορά και παρακολούθησε live',
      stepThreeCopy:
        'Δημιούργησε το checkout, στείλε την κατάθεση μία φορά και κράτησε ανοικτή τη σελίδα κατάστασης για να παρακολουθείς confirmations, expiry και provider updates σε πραγματικό χρόνο.',
    },
  },
} as const;

type MessageLocale = keyof typeof messages;

const normalizeLocale = (value?: string | null): MessageLocale => {
  const base = (value ?? 'en').trim().toLowerCase().split('-')[0];
  return base === 'el' ? 'el' : 'en';
};

const resolveMessage = (path: string, locale: MessageLocale): string => {
  const segments = path.split('.');
  let value: unknown = messages[locale];

  for (const segment of segments) {
    if (!value || typeof value !== 'object' || !(segment in value)) {
      value = undefined;
      break;
    }

    value = (value as Record<string, unknown>)[segment];
  }

  if (typeof value === 'string') {
    return value;
  }

  if (locale !== 'en') {
    return resolveMessage(path, 'en');
  }

  return path;
};

export const setAppLocale = (value?: string | null) => {
  setAppLocaleSignal(normalizeLocale(value));
};

export const useLocale = () => {
  const t = (path: string): string => {
    return resolveMessage(path, appLocale());
  };

  return {
    locale: appLocale,
    setLocale: setAppLocale,
    t,
  };
};
