import { For, createMemo } from "solid-js";
import type { SupportedLocale } from "../../i18n/config";
import { useLocale } from "../../i18n/locale";
import "./FaqSection.css";

interface FaqItem {
  question: string;
  paragraphs: string[];
  bullets?: string[];
}

const faqItemsByLocale: Record<SupportedLocale, FaqItem[]> = {
  en: [
    {
      question: "How does Assetar work?",
      paragraphs: [
        "When you fill in a transaction, we search the best available rates across partner exchanges so you can choose the offer that fits you best and swap directly with that provider. That removes the need to open an account on a centralized exchange just to make a single conversion.",
        "You send the chosen amount to the deposit address provided by the selected exchange, the trade is processed, and the destination coin is delivered straight to the wallet address you entered. It is designed to be faster and safer than managing multiple exchange accounts yourself.",
        "We also monitor rate reliability, transaction delays, maintenance windows, and server problems at partner exchanges to keep routing smoother and reduce abuse. If something goes wrong, support can step in and help investigate.",
        "Assetar provides the software layer that lets users compare exchanges and trade directly with them. We never receive, hold, or transfer the funds between the parties.",
      ],
    },
    {
      question: "Why trust us?",
      paragraphs: [
        "The service is designed around minimal data exposure. Logs are only kept when a partner exchange requires them, and each provider's policy is surfaced before a transaction is created.",
        "Logs stored by Assetar are not sold or shared with third parties and are only provided individually when law enforcement makes a valid request.",
        "JavaScript is used to improve usability, like selectors and interaction states, not to fingerprint or track users. For most features the site can still be used without JavaScript if that is your preference.",
        "Orders are only redirected to known and reliable instant exchanges. Those providers receive the deposit, execute the trade, and send funds directly to the destination address you chose. We never take custody of your coins during the process.",
      ],
    },
    {
      question: "What is the Assetar Guarantee?",
      paragraphs: [
        "Transactions created through the website are covered by the Assetar Guarantee. If a user does not receive funds and the selected exchange cannot provide sufficient proof of unusually high AML risk or a liquidity-provider AML block, Assetar reimburses up to the insured amount shown for that route.",
        "Coverage varies by exchange and can be checked through the shield indicator shown beside each exchange option. Trades with exchanges rated D are not covered. Trades blocked because of clearly high AML risk or mixer-related funds are also excluded.",
        "To request compensation, contact support by email or Telegram and include the transaction ID. Support will first try to resolve the issue with the selected exchange before reimbursement is considered.",
        "The resolution process may take a week or longer because the exchange is given time to provide evidence or complete its investigation.",
      ],
      bullets: [
        "The guarantee does not cover funds blocked because of proven AML issues.",
        "The refund process can take a week or longer while the case is reviewed with the partner exchange.",
      ],
    },
    {
      question: "What swap flow is live today?",
      paragraphs: [
        "Standard Mode is the live swap flow on the current public interface. You enter the amount you plan to send, choose the asset you want to receive, and compare the best floating and fixed rates from partner exchanges.",
        "Invoice-style payment flows are not active on the public swap widget right now, so the interface only shows the standard route-building flow.",
        "The Buy/Sell tab is used for fiat on-ramp and off-ramp flows. It can have fewer crypto options available than swap mode, but users can sometimes bridge through a more common asset if they need to reach a less common coin.",
      ],
    },
    {
      question: "How does the Fiat Gateway (Buy/Sell) work?",
      paragraphs: [
        "In the Fiat Gateway Aggregator you choose the crypto to buy or sell, the fiat currency you want to use, and the amount to trade. The platform compares rates from partner providers and lets you pick the one you prefer.",
        "Depending on currency and provider, payment methods can include card payments, bank transfer, Google Pay, Apple Pay, UPI, IMPS, GCash, PayMaya, GrabPay, and others.",
        "To complete the trade you are redirected to the partner website, which may require JavaScript. Each provider sets its own KYC and verification policy, so users should review those terms before continuing.",
        "Assetar does not control partner KYC requirements and never has access to the fiat or crypto being transferred. The service only makes the referral and comparison layer available.",
      ],
    },
    {
      question: "How long does it take to complete a transaction?",
      paragraphs: [
        "Most swaps are completed in about 5 to 60 minutes. The actual time depends mainly on network congestion, blockchain confirmation speed, and the response time of the chosen exchange.",
        "Assets with slower confirmations naturally take longer, while faster networks usually finish sooner.",
        "An approximate ETA is shown during exchange selection based on recent provider history, which helps users choose between faster and slower routes.",
      ],
    },
    {
      question: "What fees are included in the rates shown?",
      paragraphs: [
        "The quoted rates already include network transaction fees and exchange fees. There is no extra charge added on top for using the aggregator instead of going directly to the selected exchange.",
        "Larger transactions often produce better effective rates because fixed network fees are spread across a bigger amount.",
        "The platform does receive a commission for referrals, but that comes out of the exchange fee and does not change the quoted rate shown to the user.",
        "Floating-rate offers shown on the exchange selection screen can be adjusted to better reflect expected final payout using each exchange's recent execution history. The status screen later shows the actual rate reported by the exchange.",
      ],
    },
    {
      question: "Is it really private? Isn't KYC required?",
      paragraphs: [
        "Each exchange has its own KYC and AML policy. A provider can halt a transaction and request verification before completing it, especially if the deposit triggers a risk review.",
        "Partner exchanges perform due diligence on incoming funds. Users are warned not to send funds with very high AML risk or funds associated with mixers or illegal activity, because those routes are likely to be refused.",
        "To make comparison easier, the platform assigns a simple KYC and AML rating to each exchange based on policies, direct provider answers, refund handling, and past history on Assetar.",
        "Some exchanges also require logs like IP, user agent, or accept-language to be retained at Assetar. Those requirements are disclosed on the exchange screen before a trade is created.",
      ],
      bullets: [
        "A: Uses its own liquidity and is privacy-friendly.",
        "B: Refunds most transactions that fail AML checks, except in rare legal-order or stolen-funds cases.",
        "C: Usually refunds failed AML checks, but liquidity-provider reviews may still require KYC or source-of-funds verification.",
        "D: Blocks failed AML checks until KYC or source-of-funds verification is passed.",
      ],
    },
    {
      question: "Why do only a few exchanges appear as options for my trade?",
      paragraphs: [
        "Some exchanges support very small trades, but many set higher minimums because network fees can destroy the economics of tiny swaps. If you are only checking rates, use an amount close to the one you actually plan to trade.",
        "Availability can also narrow when swapping directly between two less common assets. In those cases, routing through a more liquid intermediary coin can open up more provider options.",
      ],
    },
    {
      question: "What's the difference between Floating and Fixed Rate?",
      paragraphs: [
        "A floating rate is an estimate. After the exchange confirms your deposit, it recalculates the trade based on live market conditions. If the market has moved materially, some providers may ask whether you want to continue at the new rate or request a refund.",
        "Floating rates are usually better for regular conversions where you already know the amount you want to send. They tend to be more competitive than fixed rates.",
        "Fixed rates are more useful when the payout amount must be exact, such as paying an invoice. You lock in the amount of the sending coin required to receive a specific amount of the destination coin.",
        "Even fixed-rate quotes can still be refunded if the market moves too far before the provider can confirm the transaction. It is best to have the wallet ready before confirming so the quote does not expire.",
      ],
    },
    {
      question: "What happens if I send the wrong amount to the address provided?",
      paragraphs: [
        "It depends on the exchange. Some providers accept slightly different amounts and complete the trade proportionally. Others may halt the transaction or fail to detect the deposit cleanly.",
        "Users should always send the exact amount shown on the status page to avoid refund delays or support intervention. The status view can also indicate whether the selected provider requires exact amounts.",
      ],
    },
    {
      question: "My transaction has failed and I haven't got my funds back. What do I do now?",
      paragraphs: [
        "If a transaction fails and the refund has not arrived, contact support using the channels listed by the service and include the transaction details shown on the status page.",
        "You can also contact the selected exchange directly if you prefer, but support can step in to help review the case and push for a resolution when needed.",
      ],
    },
  ],
  el: [
    {
      question: "Πώς λειτουργεί το Assetar;",
      paragraphs: [
        "Όταν συμπληρώνεις μια συναλλαγή, αναζητούμε τις καλύτερες διαθέσιμες τιμές σε συνεργαζόμενα exchanges ώστε να επιλέξεις την προσφορά που σου ταιριάζει καλύτερα και να κάνεις swap απευθείας με αυτόν τον πάροχο. Έτσι δεν χρειάζεται να ανοίξεις λογαριασμό σε κεντρικοποιημένο exchange μόνο για μία μετατροπή.",
        "Στέλνεις το επιλεγμένο ποσό στη διεύθυνση κατάθεσης που παρέχει το exchange, η συναλλαγή εκτελείται και το νόμισμα προορισμού αποστέλλεται απευθείας στη διεύθυνση wallet που έδωσες. Η διαδικασία είναι σχεδιασμένη ώστε να είναι ταχύτερη και ασφαλέστερη από το να διαχειρίζεσαι μόνος σου πολλαπλούς λογαριασμούς exchange.",
        "Παρακολουθούμε επίσης την αξιοπιστία των τιμών, τις καθυστερήσεις συναλλαγών, τα παράθυρα συντήρησης και τα προβλήματα servers των συνεργαζόμενων exchanges για πιο ομαλή δρομολόγηση και λιγότερη κατάχρηση. Αν κάτι πάει στραβά, η υποστήριξη μπορεί να παρέμβει και να βοηθήσει στην έρευνα.",
        "Το Assetar παρέχει το software layer που επιτρέπει στους χρήστες να συγκρίνουν exchanges και να κάνουν trade απευθείας με αυτά. Δεν λαμβάνουμε, δεν κρατάμε και δεν μεταφέρουμε ποτέ τα funds μεταξύ των μερών.",
      ],
    },
    {
      question: "Γιατί να μας εμπιστευτείς;",
      paragraphs: [
        "Η υπηρεσία έχει σχεδιαστεί με ελάχιστη έκθεση δεδομένων. Logs διατηρούνται μόνο όταν το απαιτεί συνεργαζόμενο exchange και η πολιτική κάθε παρόχου εμφανίζεται πριν δημιουργηθεί μια συναλλαγή.",
        "Τα logs που αποθηκεύονται στο Assetar δεν πωλούνται και δεν κοινοποιούνται σε τρίτους και παρέχονται μόνο μεμονωμένα όταν υπάρχει έγκυρο αίτημα από τις αρχές.",
        "Η JavaScript χρησιμοποιείται για βελτίωση της ευχρηστίας, όπως selectors και states αλληλεπίδρασης, όχι για fingerprinting ή tracking χρηστών. Για τα περισσότερα features ο ιστότοπος μπορεί να χρησιμοποιηθεί και χωρίς JavaScript αν αυτό προτιμάς.",
        "Οι παραγγελίες δρομολογούνται μόνο σε γνωστά και αξιόπιστα instant exchanges. Αυτοί οι πάροχοι λαμβάνουν την κατάθεση, εκτελούν το trade και στέλνουν τα funds απευθείας στη διεύθυνση προορισμού που επέλεξες. Δεν έχουμε ποτέ custody των coins σου κατά τη διαδικασία.",
      ],
    },
    {
      question: "Τι είναι η Εγγύηση Assetar;",
      paragraphs: [
        "Οι συναλλαγές που δημιουργούνται μέσω του site καλύπτονται από την Εγγύηση Assetar. Αν ο χρήστης δεν λάβει funds και το επιλεγμένο exchange δεν μπορέσει να προσφέρει επαρκή απόδειξη για ασυνήθιστα υψηλό AML risk ή AML block από liquidity provider, το Assetar αποζημιώνει έως το ασφαλισμένο ποσό που εμφανίζεται για εκείνη τη route.",
        "Η κάλυψη διαφέρει ανά exchange και μπορεί να ελεγχθεί από το shield indicator που εμφανίζεται δίπλα σε κάθε επιλογή exchange. Trades με exchanges βαθμολογίας D δεν καλύπτονται. Εξαιρούνται επίσης trades που μπλοκάρονται λόγω ξεκάθαρα υψηλού AML risk ή funds σχετικών με mixers.",
        "Για να ζητήσεις αποζημίωση, επικοινώνησε με την υποστήριξη μέσω email ή Telegram και συμπερίλαβε το transaction ID. Η υποστήριξη θα προσπαθήσει πρώτα να λύσει το ζήτημα με το επιλεγμένο exchange πριν εξεταστεί η αποζημίωση.",
        "Η διαδικασία επίλυσης μπορεί να διαρκέσει μία εβδομάδα ή και περισσότερο, επειδή δίνεται χρόνος στο exchange να προσκομίσει αποδείξεις ή να ολοκληρώσει την έρευνά του.",
      ],
      bullets: [
        "Η εγγύηση δεν καλύπτει funds που μπλοκάρονται λόγω αποδεδειγμένων AML ζητημάτων.",
        "Η διαδικασία επιστροφής μπορεί να διαρκέσει μία εβδομάδα ή περισσότερο όσο η υπόθεση εξετάζεται με το συνεργαζόμενο exchange.",
      ],
    },
    {
      question: "Ποια ροή swap είναι ενεργή σήμερα;",
      paragraphs: [
        "Το Standard Mode είναι η ενεργή ροή swap στη σημερινή δημόσια διεπαφή. Εισάγεις το ποσό που σκοπεύεις να στείλεις, επιλέγεις το asset που θέλεις να λάβεις και συγκρίνεις τις καλύτερες floating και fixed rates από συνεργαζόμενα exchanges.",
        "Ροές πληρωμών τύπου invoice δεν είναι ενεργές στο δημόσιο swap widget αυτή τη στιγμή, οπότε η διεπαφή εμφανίζει μόνο την τυπική ροή δημιουργίας route.",
        "Η καρτέλα Buy/Sell χρησιμοποιείται για fiat on-ramp και off-ramp ροές. Μπορεί να έχει λιγότερες διαθέσιμες crypto επιλογές από το swap mode, αλλά ο χρήστης μερικές φορές μπορεί να κάνει bridge μέσω πιο συνηθισμένου asset για να φτάσει σε λιγότερο κοινό νόμισμα.",
      ],
    },
    {
      question: "Πώς λειτουργεί το Fiat Gateway (Buy/Sell);",
      paragraphs: [
        "Στο Fiat Gateway Aggregator επιλέγεις το crypto που θέλεις να αγοράσεις ή να πουλήσεις, το fiat νόμισμα που θέλεις να χρησιμοποιήσεις και το ποσό που θέλεις να ανταλλάξεις. Η πλατφόρμα συγκρίνει τιμές από συνεργαζόμενους παρόχους και σου επιτρέπει να επιλέξεις αυτόν που προτιμάς.",
        "Ανάλογα με το νόμισμα και τον πάροχο, οι μέθοδοι πληρωμής μπορεί να περιλαμβάνουν κάρτες, τραπεζική μεταφορά, Google Pay, Apple Pay, UPI, IMPS, GCash, PayMaya, GrabPay και άλλες.",
        "Για να ολοκληρωθεί το trade μεταφέρεσαι στο site του συνεργάτη, το οποίο μπορεί να απαιτεί JavaScript. Κάθε πάροχος ορίζει τη δική του πολιτική KYC και verification, οπότε οι χρήστες πρέπει να διαβάζουν αυτούς τους όρους πριν συνεχίσουν.",
        "Το Assetar δεν ελέγχει τις απαιτήσεις KYC των συνεργατών και δεν έχει ποτέ πρόσβαση στο fiat ή στο crypto που μεταφέρεται. Η υπηρεσία παρέχει μόνο το layer παραπομπής και σύγκρισης.",
      ],
    },
    {
      question: "Πόσος χρόνος χρειάζεται για να ολοκληρωθεί μια συναλλαγή;",
      paragraphs: [
        "Τα περισσότερα swaps ολοκληρώνονται σε περίπου 5 έως 60 λεπτά. Ο πραγματικός χρόνος εξαρτάται κυρίως από τη συμφόρηση δικτύου, την ταχύτητα επιβεβαίωσης στο blockchain και τον χρόνο απόκρισης του επιλεγμένου exchange.",
        "Assets με πιο αργές επιβεβαιώσεις χρειάζονται φυσικά περισσότερο χρόνο, ενώ ταχύτερα δίκτυα συνήθως ολοκληρώνονται γρηγορότερα.",
        "Εμφανίζεται ένα κατά προσέγγιση ETA κατά την επιλογή exchange με βάση το πρόσφατο ιστορικό του παρόχου, ώστε ο χρήστης να διαλέγει ανάμεσα σε ταχύτερες και πιο αργές routes.",
      ],
    },
    {
      question: "Ποιες χρεώσεις περιλαμβάνονται στις εμφανιζόμενες τιμές;",
      paragraphs: [
        "Οι εμφανιζόμενες τιμές περιλαμβάνουν ήδη network transaction fees και exchange fees. Δεν προστίθεται επιπλέον χρέωση για τη χρήση του aggregator αντί να πας απευθείας στο επιλεγμένο exchange.",
        "Μεγαλύτερες συναλλαγές δίνουν συχνά καλύτερες πραγματικές τιμές επειδή τα σταθερά network fees κατανέμονται σε μεγαλύτερο ποσό.",
        "Η πλατφόρμα λαμβάνει προμήθεια για referrals, αλλά αυτή προέρχεται από το exchange fee και δεν αλλάζει την τιμή που εμφανίζεται στον χρήστη.",
        "Οι floating-rate προσφορές στην οθόνη επιλογής exchange μπορούν να προσαρμόζονται ώστε να αντανακλούν καλύτερα το αναμενόμενο τελικό payout με βάση το πρόσφατο ιστορικό εκτέλεσης κάθε exchange. Η οθόνη κατάστασης αργότερα εμφανίζει την πραγματική τιμή που δήλωσε το exchange.",
      ],
    },
    {
      question: "Είναι όντως ιδιωτικό; Δεν απαιτείται KYC;",
      paragraphs: [
        "Κάθε exchange έχει τη δική του πολιτική KYC και AML. Ένας πάροχος μπορεί να παγώσει μια συναλλαγή και να ζητήσει verification πριν την ολοκληρώσει, ειδικά αν η κατάθεση ενεργοποιήσει risk review.",
        "Τα συνεργαζόμενα exchanges κάνουν due diligence στα εισερχόμενα funds. Οι χρήστες προειδοποιούνται να μην στέλνουν funds με πολύ υψηλό AML risk ή funds που σχετίζονται με mixers ή παράνομη δραστηριότητα, επειδή τέτοιες routes είναι πιθανό να απορριφθούν.",
        "Για να γίνει ευκολότερη η σύγκριση, η πλατφόρμα αποδίδει μια απλή αξιολόγηση KYC και AML σε κάθε exchange με βάση πολιτικές, άμεσες απαντήσεις παρόχων, χειρισμό refunds και προηγούμενο ιστορικό στο Assetar.",
        "Ορισμένα exchanges απαιτούν επίσης logs όπως IP, user agent ή accept-language να τηρούνται στο Assetar. Αυτές οι απαιτήσεις γνωστοποιούνται στην οθόνη exchange πριν δημιουργηθεί trade.",
      ],
      bullets: [
        "A: Χρησιμοποιεί δική του ρευστότητα και είναι privacy-friendly.",
        "B: Κάνει refund στις περισσότερες συναλλαγές που αποτυγχάνουν σε AML checks, εκτός από σπάνιες περιπτώσεις νομικής εντολής ή κλεμμένων funds.",
        "C: Συνήθως κάνει refund σε αποτυχημένα AML checks, αλλά οι έλεγχοι liquidity provider μπορεί ακόμα να απαιτήσουν KYC ή verification προέλευσης κεφαλαίων.",
        "D: Μπλοκάρει αποτυχημένα AML checks μέχρι να περάσει KYC ή verification προέλευσης κεφαλαίων.",
      ],
    },
    {
      question: "Γιατί εμφανίζονται μόνο λίγα exchanges ως επιλογές για το trade μου;",
      paragraphs: [
        "Ορισμένα exchanges υποστηρίζουν πολύ μικρές συναλλαγές, αλλά πολλά θέτουν υψηλότερα ελάχιστα ποσά επειδή τα network fees μπορούν να καταστρέψουν την οικονομική λογική μικροσκοπικών swaps. Αν απλώς ελέγχεις τιμές, χρησιμοποίησε ποσό κοντά σε αυτό που πραγματικά σκοπεύεις να ανταλλάξεις.",
        "Η διαθεσιμότητα μπορεί επίσης να περιορίζεται όταν κάνεις swap απευθείας μεταξύ δύο λιγότερο κοινών assets. Σε τέτοιες περιπτώσεις, η δρομολόγηση μέσω ενός πιο ρευστού ενδιάμεσου νομίσματος μπορεί να ανοίξει περισσότερες επιλογές παρόχων.",
      ],
    },
    {
      question: "Ποια είναι η διαφορά μεταξύ Floating και Fixed Rate;",
      paragraphs: [
        "Η floating rate είναι μια εκτίμηση. Αφού το exchange επιβεβαιώσει την κατάθεσή σου, επανυπολογίζει το trade με βάση τις ζωντανές συνθήκες της αγοράς. Αν η αγορά έχει κινηθεί σημαντικά, ορισμένοι πάροχοι μπορεί να σε ρωτήσουν αν θέλεις να συνεχίσεις με τη νέα τιμή ή να ζητήσεις refund.",
        "Οι floating rates είναι συνήθως καλύτερες για κανονικές μετατροπές όπου ήδη γνωρίζεις το ποσό που θέλεις να στείλεις. Τείνουν να είναι πιο ανταγωνιστικές από τις fixed rates.",
        "Οι fixed rates είναι πιο χρήσιμες όταν το ποσό payout πρέπει να είναι ακριβές, όπως στην πληρωμή invoice. Κλειδώνεις το ποσό του νομίσματος αποστολής που απαιτείται για να λάβεις συγκεκριμένο ποσό του νομίσματος προορισμού.",
        "Ακόμη και οι fixed-rate προσφορές μπορεί να επιστραφούν αν η αγορά κινηθεί υπερβολικά πριν ο πάροχος προλάβει να επιβεβαιώσει τη συναλλαγή. Καλό είναι να έχεις το wallet έτοιμο πριν επιβεβαιώσεις, ώστε να μην λήξει το quote.",
      ],
    },
    {
      question: "Τι συμβαίνει αν στείλω λάθος ποσό στη διεύθυνση που δόθηκε;",
      paragraphs: [
        "Εξαρτάται από το exchange. Κάποιοι πάροχοι δέχονται ελαφρώς διαφορετικά ποσά και ολοκληρώνουν το trade αναλογικά. Άλλοι μπορεί να σταματήσουν τη συναλλαγή ή να μην εντοπίσουν καθαρά την κατάθεση.",
        "Οι χρήστες πρέπει πάντα να στέλνουν το ακριβές ποσό που εμφανίζεται στη σελίδα κατάστασης για να αποφεύγονται καθυστερήσεις σε refunds ή ανάγκη παρέμβασης από την υποστήριξη. Η προβολή κατάστασης μπορεί επίσης να δείχνει αν ο επιλεγμένος πάροχος απαιτεί ακριβή ποσά.",
      ],
    },
    {
      question: "Η συναλλαγή μου απέτυχε και δεν έχω πάρει πίσω τα funds μου. Τι κάνω τώρα;",
      paragraphs: [
        "Αν μια συναλλαγή αποτύχει και το refund δεν έχει φτάσει, επικοινώνησε με την υποστήριξη μέσω των καναλιών που εμφανίζει η υπηρεσία και συμπερίλαβε τα στοιχεία συναλλαγής που φαίνονται στη σελίδα κατάστασης.",
        "Μπορείς επίσης να επικοινωνήσεις απευθείας με το επιλεγμένο exchange αν το προτιμάς, αλλά η υποστήριξη μπορεί να βοηθήσει να εξεταστεί η υπόθεση και να πιέσει για λύση όταν χρειάζεται.",
      ],
    },
  ],
  es: [
    {
      question: "¿Cómo funciona Assetar?",
      paragraphs: [
        "Cuando completas una transacción, buscamos las mejores tasas disponibles entre los exchanges asociados para que puedas elegir la oferta que mejor te convenga y hacer el swap directamente con ese proveedor. Así evitas abrir una cuenta en un exchange centralizado solo para una conversión puntual.",
        "Envías la cantidad elegida a la dirección de depósito proporcionada por el exchange seleccionado, la operación se procesa y la moneda de destino se entrega directamente a la dirección de wallet que introdujiste. Está pensado para ser más rápido y seguro que gestionar varias cuentas de exchange por tu cuenta.",
        "También supervisamos la fiabilidad de las tasas, los retrasos en las transacciones, las ventanas de mantenimiento y los problemas de servidor en los exchanges asociados para que el enrutamiento sea más fluido y haya menos abusos. Si algo sale mal, soporte puede intervenir y ayudarte a investigarlo.",
        "Assetar proporciona la capa de software que permite a los usuarios comparar exchanges y operar directamente con ellos. Nunca recibimos, retenemos ni transferimos los fondos entre las partes.",
      ],
    },
    {
      question: "¿Por qué confiar en nosotros?",
      paragraphs: [
        "El servicio está diseñado para minimizar la exposición de datos. Los registros solo se conservan cuando un exchange asociado lo exige, y la política de cada proveedor se muestra antes de que se cree la transacción.",
        "Los registros almacenados por Assetar no se venden ni se comparten con terceros y solo se entregan de forma individual cuando las autoridades hacen una solicitud válida.",
        "JavaScript se utiliza para mejorar la experiencia de uso, como selectores y estados de interacción, no para hacer fingerprinting ni rastrear usuarios. En la mayoría de las funciones el sitio puede seguir utilizándose sin JavaScript si así lo prefieres.",
        "Las órdenes solo se redirigen a exchanges instantáneos conocidos y confiables. Esos proveedores reciben el depósito, ejecutan la operación y envían los fondos directamente a la dirección de destino que elegiste. Nunca tomamos custodia de tus monedas durante el proceso.",
      ],
    },
    {
      question: "¿Qué es la Garantía de Assetar?",
      paragraphs: [
        "Las transacciones creadas a través del sitio web están cubiertas por la Garantía de Assetar. Si un usuario no recibe fondos y el exchange seleccionado no puede aportar pruebas suficientes de un riesgo AML inusualmente alto o de un bloqueo AML del proveedor de liquidez, Assetar reembolsa hasta la cantidad asegurada mostrada para esa ruta.",
        "La cobertura varía según el exchange y puede comprobarse mediante el indicador de escudo que aparece junto a cada opción de exchange. Las operaciones con exchanges calificados como D no están cubiertas. Tampoco se cubren las operaciones bloqueadas por un riesgo AML claramente alto o por fondos relacionados con mixers.",
        "Para solicitar compensación, contacta con soporte por correo o Telegram e incluye el ID de la transacción. Soporte intentará primero resolver el problema con el exchange seleccionado antes de considerar el reembolso.",
        "El proceso de resolución puede tardar una semana o más porque se da tiempo al exchange para aportar pruebas o completar su investigación.",
      ],
      bullets: [
        "La garantía no cubre fondos bloqueados por problemas AML demostrados.",
        "El proceso de reembolso puede tardar una semana o más mientras el caso se revisa con el exchange asociado.",
      ],
    },
    {
      question: "¿Qué flujo de swap está activo hoy?",
      paragraphs: [
        "El Modo Estándar es el flujo de swap activo en la interfaz pública actual. Introduces la cantidad que planeas enviar, eliges el activo que quieres recibir y comparas las mejores tasas flotantes y fijas de los exchanges asociados.",
        "Los flujos de pago tipo factura no están activos ahora mismo en el widget público de swap, por lo que la interfaz solo muestra el flujo estándar de construcción de rutas.",
        "La pestaña Buy/Sell se usa para flujos de entrada y salida fiat. Puede tener menos opciones cripto disponibles que el modo swap, pero a veces los usuarios pueden puentear a través de un activo más común si necesitan llegar a una moneda menos común.",
      ],
    },
    {
      question: "¿Cómo funciona el Fiat Gateway (Buy/Sell)?",
      paragraphs: [
        "En el agregador Fiat Gateway eliges la criptomoneda que quieres comprar o vender, la moneda fiat que quieres usar y la cantidad a intercambiar. La plataforma compara tasas entre proveedores asociados y te permite elegir el que prefieras.",
        "Dependiendo de la moneda y del proveedor, los métodos de pago pueden incluir tarjeta, transferencia bancaria, Google Pay, Apple Pay, UPI, IMPS, GCash, PayMaya, GrabPay y otros.",
        "Para completar la operación se te redirige al sitio del proveedor, que puede requerir JavaScript. Cada proveedor establece su propia política de KYC y verificación, por lo que los usuarios deben revisar esos términos antes de continuar.",
        "Assetar no controla los requisitos KYC de los socios y nunca tiene acceso al fiat o al cripto que se transfiere. El servicio solo ofrece la capa de referencia y comparación.",
      ],
    },
    {
      question: "¿Cuánto tarda en completarse una transacción?",
      paragraphs: [
        "La mayoría de los swaps se completan en unos 5 a 60 minutos. El tiempo real depende principalmente de la congestión de la red, la velocidad de confirmación de la blockchain y el tiempo de respuesta del exchange elegido.",
        "Los activos con confirmaciones más lentas tardan naturalmente más, mientras que las redes más rápidas suelen terminar antes.",
        "Durante la selección del exchange se muestra un ETA aproximado basado en el historial reciente de cada proveedor, lo que ayuda a elegir entre rutas más rápidas o más lentas.",
      ],
    },
    {
      question: "¿Qué comisiones están incluidas en las tasas mostradas?",
      paragraphs: [
        "Las tasas mostradas ya incluyen las comisiones de transacción de red y las comisiones del exchange. No se añade ningún cargo extra por usar el agregador en lugar de ir directamente al exchange seleccionado.",
        "Las transacciones más grandes suelen ofrecer mejores tasas efectivas porque las comisiones fijas de red se reparten sobre una cantidad mayor.",
        "La plataforma recibe una comisión por las referencias, pero esa comisión sale de la tarifa del exchange y no cambia la tasa mostrada al usuario.",
        "Las ofertas de tasa flotante mostradas en la pantalla de selección de exchange pueden ajustarse para reflejar mejor el payout final esperado usando el historial reciente de ejecución de cada exchange. La pantalla de estado muestra después la tasa real reportada por el exchange.",
      ],
    },
    {
      question: "¿Es realmente privado? ¿No se requiere KYC?",
      paragraphs: [
        "Cada exchange tiene su propia política de KYC y AML. Un proveedor puede detener una transacción y pedir verificación antes de completarla, especialmente si el depósito activa una revisión de riesgo.",
        "Los exchanges asociados realizan controles sobre los fondos entrantes. Se advierte a los usuarios que no envíen fondos con riesgo AML muy alto o asociados a mixers o actividades ilegales, porque esas rutas probablemente serán rechazadas.",
        "Para facilitar la comparación, la plataforma asigna una calificación simple de KYC y AML a cada exchange basada en sus políticas, respuestas directas, gestión de reembolsos e historial previo en Assetar.",
        "Algunos exchanges también exigen conservar en Assetar registros como IP, user agent o accept-language. Esos requisitos se muestran en la pantalla del exchange antes de crear una operación.",
      ],
      bullets: [
        "A: Usa su propia liquidez y es favorable a la privacidad.",
        "B: Reembolsa la mayoría de las transacciones que fallan los controles AML, salvo en casos raros de orden legal o fondos robados.",
        "C: Suele reembolsar los fallos AML, pero las revisiones del proveedor de liquidez aún pueden requerir KYC o verificación del origen de fondos.",
        "D: Bloquea los fallos AML hasta que se aprueba el KYC o la verificación del origen de fondos.",
      ],
    },
    {
      question: "¿Por qué solo aparecen unos pocos exchanges como opciones para mi operación?",
      paragraphs: [
        "Algunos exchanges admiten operaciones muy pequeñas, pero muchos establecen mínimos más altos porque las comisiones de red pueden destruir la economía de swaps diminutos. Si solo estás comprobando tasas, usa una cantidad cercana a la que realmente planeas operar.",
        "La disponibilidad también puede reducirse al hacer swap directo entre dos activos menos comunes. En esos casos, enrutar a través de una moneda intermedia con más liquidez puede abrir más opciones de proveedores.",
      ],
    },
    {
      question: "¿Cuál es la diferencia entre Floating y Fixed Rate?",
      paragraphs: [
        "Una tasa flotante es una estimación. Después de que el exchange confirma tu depósito, recalcula la operación según las condiciones del mercado en tiempo real. Si el mercado se ha movido de forma relevante, algunos proveedores pueden preguntarte si quieres continuar con la nueva tasa o pedir un reembolso.",
        "Las tasas flotantes suelen ser mejores para conversiones normales en las que ya sabes la cantidad que quieres enviar. Normalmente son más competitivas que las tasas fijas.",
        "Las tasas fijas son más útiles cuando la cantidad de salida debe ser exacta, como al pagar una factura. Bloqueas la cantidad de la moneda de envío necesaria para recibir una cantidad específica de la moneda de destino.",
        "Incluso las cotizaciones a tasa fija pueden reembolsarse si el mercado se mueve demasiado antes de que el proveedor pueda confirmar la transacción. Lo mejor es tener la wallet preparada antes de confirmar para que la cotización no expire.",
      ],
    },
    {
      question: "¿Qué pasa si envío una cantidad incorrecta a la dirección proporcionada?",
      paragraphs: [
        "Depende del exchange. Algunos proveedores aceptan cantidades ligeramente diferentes y completan la operación de forma proporcional. Otros pueden detener la transacción o no detectar bien el depósito.",
        "Los usuarios deben enviar siempre la cantidad exacta mostrada en la página de estado para evitar retrasos en los reembolsos o intervención de soporte. La vista de estado también puede indicar si el proveedor seleccionado exige cantidades exactas.",
      ],
    },
    {
      question: "Mi transacción ha fallado y no me han devuelto los fondos. ¿Qué hago ahora?",
      paragraphs: [
        "Si una transacción falla y el reembolso no ha llegado, contacta con soporte usando los canales indicados por el servicio e incluye los detalles de la transacción que aparecen en la página de estado.",
        "También puedes contactar directamente con el exchange seleccionado si lo prefieres, pero soporte puede intervenir para revisar el caso y presionar por una resolución cuando sea necesario.",
      ],
    },
  ],
  fr: [
    {
      question: "Comment fonctionne Assetar ?",
      paragraphs: [
        "Lorsque vous remplissez une transaction, nous recherchons les meilleurs taux disponibles auprès des exchanges partenaires afin que vous puissiez choisir l’offre qui vous convient le mieux et effectuer le swap directement avec ce fournisseur. Cela évite d’ouvrir un compte sur un exchange centralisé pour une seule conversion.",
        "Vous envoyez le montant choisi à l’adresse de dépôt fournie par l’exchange sélectionné, la transaction est traitée et la monnaie de destination est livrée directement à l’adresse wallet que vous avez renseignée. Le système est conçu pour être plus rapide et plus sûr que la gestion manuelle de plusieurs comptes d’exchange.",
        "Nous surveillons aussi la fiabilité des taux, les retards de transaction, les fenêtres de maintenance et les problèmes de serveurs chez les exchanges partenaires afin de rendre le routage plus fluide et de limiter les abus. Si quelque chose se passe mal, le support peut intervenir et aider à enquêter.",
        "Assetar fournit la couche logicielle qui permet aux utilisateurs de comparer les exchanges et d’effectuer des trades directement avec eux. Nous ne recevons, ne détenons ni ne transférons jamais les fonds entre les parties.",
      ],
    },
    {
      question: "Pourquoi nous faire confiance ?",
      paragraphs: [
        "Le service est conçu pour limiter au maximum l’exposition des données. Les logs ne sont conservés que lorsqu’un exchange partenaire l’exige, et la politique de chaque fournisseur est affichée avant la création d’une transaction.",
        "Les logs stockés par Assetar ne sont ni vendus ni partagés avec des tiers et ne sont transmis qu’au cas par cas lorsqu’une demande valable émane des autorités.",
        "JavaScript est utilisé pour améliorer l’ergonomie, comme les sélecteurs et les états d’interaction, et non pour faire du fingerprinting ou du suivi des utilisateurs. Pour la plupart des fonctionnalités, le site reste utilisable sans JavaScript si vous le préférez.",
        "Les ordres ne sont redirigés que vers des exchanges instantanés connus et fiables. Ces fournisseurs reçoivent le dépôt, exécutent la transaction et envoient les fonds directement à l’adresse de destination que vous avez choisie. Nous ne prenons jamais la garde de vos coins pendant le processus.",
      ],
    },
    {
      question: "Qu’est-ce que la Garantie Assetar ?",
      paragraphs: [
        "Les transactions créées via le site sont couvertes par la Garantie Assetar. Si un utilisateur ne reçoit pas les fonds et que l’exchange sélectionné ne peut pas fournir de preuve suffisante d’un risque AML anormalement élevé ou d’un blocage AML du fournisseur de liquidité, Assetar rembourse jusqu’au montant assuré affiché pour cette route.",
        "La couverture varie selon l’exchange et peut être vérifiée via l’indicateur bouclier affiché à côté de chaque option d’exchange. Les trades avec des exchanges notés D ne sont pas couverts. Les trades bloqués en raison d’un risque AML manifestement élevé ou de fonds liés à des mixers sont également exclus.",
        "Pour demander une compensation, contactez le support par e-mail ou via Telegram en incluant l’ID de transaction. Le support tentera d’abord de résoudre le problème avec l’exchange sélectionné avant d’envisager un remboursement.",
        "Le processus de résolution peut prendre une semaine ou plus, car l’exchange dispose de temps pour fournir des preuves ou terminer son enquête.",
      ],
      bullets: [
        "La garantie ne couvre pas les fonds bloqués en raison de problèmes AML avérés.",
        "Le processus de remboursement peut prendre une semaine ou plus pendant l’examen du dossier avec l’exchange partenaire.",
      ],
    },
    {
      question: "Quel flux de swap est actif aujourd’hui ?",
      paragraphs: [
        "Le mode Standard est le flux de swap actif sur l’interface publique actuelle. Vous saisissez le montant que vous comptez envoyer, choisissez l’actif que vous souhaitez recevoir et comparez les meilleures offres flottantes et fixes provenant des exchanges partenaires.",
        "Les flux de paiement de type facture ne sont pas actifs sur le widget public de swap pour le moment, l’interface n’affiche donc que le flux standard de construction de route.",
        "L’onglet Buy/Sell est utilisé pour les flux fiat d’entrée et de sortie. Il peut proposer moins d’options crypto que le mode swap, mais l’utilisateur peut parfois passer par un actif plus courant pour atteindre une monnaie moins répandue.",
      ],
    },
    {
      question: "Comment fonctionne le Fiat Gateway (Buy/Sell) ?",
      paragraphs: [
        "Dans l’agrégateur Fiat Gateway, vous choisissez la crypto à acheter ou à vendre, la monnaie fiat à utiliser et le montant à échanger. La plateforme compare les taux de fournisseurs partenaires et vous laisse choisir celui que vous préférez.",
        "Selon la devise et le fournisseur, les moyens de paiement peuvent inclure la carte bancaire, le virement bancaire, Google Pay, Apple Pay, UPI, IMPS, GCash, PayMaya, GrabPay et d’autres.",
        "Pour finaliser l’opération, vous êtes redirigé vers le site du partenaire, qui peut exiger JavaScript. Chaque fournisseur définit sa propre politique de KYC et de vérification, les utilisateurs doivent donc examiner ces conditions avant de continuer.",
        "Assetar ne contrôle pas les exigences KYC des partenaires et n’a jamais accès aux fiat ou aux crypto transférés. Le service fournit uniquement la couche de mise en relation et de comparaison.",
      ],
    },
    {
      question: "Combien de temps faut-il pour terminer une transaction ?",
      paragraphs: [
        "La plupart des swaps sont terminés en environ 5 à 60 minutes. Le délai réel dépend surtout de la congestion réseau, de la vitesse de confirmation sur la blockchain et du temps de réponse de l’exchange choisi.",
        "Les actifs avec des confirmations plus lentes prennent naturellement plus de temps, tandis que les réseaux plus rapides se terminent généralement plus vite.",
        "Une ETA approximative est affichée pendant la sélection de l’exchange en fonction de l’historique récent du fournisseur, ce qui aide l’utilisateur à choisir entre des routes plus rapides ou plus lentes.",
      ],
    },
    {
      question: "Quels frais sont inclus dans les taux affichés ?",
      paragraphs: [
        "Les taux affichés incluent déjà les frais de transaction réseau et les frais d’exchange. Aucun supplément n’est ajouté pour l’utilisation de l’agrégateur plutôt que de passer directement par l’exchange sélectionné.",
        "Les transactions plus importantes donnent souvent de meilleurs taux effectifs, car les frais réseau fixes sont répartis sur un montant plus élevé.",
        "La plateforme reçoit une commission pour les referrals, mais celle-ci est prise sur les frais de l’exchange et ne modifie pas le taux affiché à l’utilisateur.",
        "Les offres à taux flottant affichées sur l’écran de sélection de l’exchange peuvent être ajustées afin de mieux refléter le payout final attendu à partir de l’historique récent d’exécution de chaque exchange. L’écran de statut affiche ensuite le taux réel communiqué par l’exchange.",
      ],
    },
    {
      question: "Est-ce vraiment privé ? Le KYC n’est-il pas requis ?",
      paragraphs: [
        "Chaque exchange a sa propre politique KYC et AML. Un fournisseur peut suspendre une transaction et demander une vérification avant de la finaliser, surtout si le dépôt déclenche une revue de risque.",
        "Les exchanges partenaires effectuent des contrôles sur les fonds entrants. Il est déconseillé d’envoyer des fonds à très haut risque AML ou associés à des mixers ou à une activité illégale, car ces routes seront probablement refusées.",
        "Pour faciliter la comparaison, la plateforme attribue une note simple de KYC et d’AML à chaque exchange en fonction de ses politiques, des réponses directes des fournisseurs, de la gestion des remboursements et de l’historique passé sur Assetar.",
        "Certains exchanges exigent aussi que des logs comme l’IP, le user agent ou l’accept-language soient conservés chez Assetar. Ces exigences sont indiquées sur l’écran de l’exchange avant la création d’un trade.",
      ],
      bullets: [
        "A : Utilise sa propre liquidité et respecte la vie privée.",
        "B : Rembourse la plupart des transactions qui échouent aux contrôles AML, sauf dans de rares cas d’ordre légal ou de fonds volés.",
        "C : Rembourse généralement les échecs AML, mais les revues du fournisseur de liquidité peuvent encore exiger un KYC ou une vérification de l’origine des fonds.",
        "D : Bloque les échecs AML jusqu’à validation du KYC ou de la vérification de l’origine des fonds.",
      ],
    },
    {
      question: "Pourquoi seuls quelques exchanges apparaissent-ils comme options pour mon trade ?",
      paragraphs: [
        "Certains exchanges prennent en charge de très petits trades, mais beaucoup imposent des minimums plus élevés, car les frais réseau peuvent rendre les petits swaps économiquement non viables. Si vous vérifiez seulement les taux, utilisez un montant proche de celui que vous comptez réellement trader.",
        "La disponibilité peut aussi se réduire lors d’un swap direct entre deux actifs moins courants. Dans ce cas, passer par une monnaie intermédiaire plus liquide peut ouvrir davantage d’options de fournisseurs.",
      ],
    },
    {
      question: "Quelle est la différence entre Floating et Fixed Rate ?",
      paragraphs: [
        "Un taux flottant est une estimation. Une fois votre dépôt confirmé par l’exchange, celui-ci recalcule le trade selon les conditions du marché en direct. Si le marché a fortement bougé, certains fournisseurs peuvent vous demander si vous souhaitez continuer avec le nouveau taux ou demander un remboursement.",
        "Les taux flottants sont généralement meilleurs pour des conversions classiques où vous connaissez déjà le montant que vous voulez envoyer. Ils sont souvent plus compétitifs que les taux fixes.",
        "Les taux fixes sont plus utiles lorsque le montant reçu doit être exact, par exemple pour payer une facture. Vous verrouillez le montant de la monnaie envoyée nécessaire pour recevoir une quantité précise de la monnaie de destination.",
        "Même les cotations à taux fixe peuvent être remboursées si le marché bouge trop avant que le fournisseur ne puisse confirmer la transaction. Il vaut mieux avoir le wallet prêt avant de confirmer pour éviter l’expiration du devis.",
      ],
    },
    {
      question: "Que se passe-t-il si j’envoie un mauvais montant à l’adresse fournie ?",
      paragraphs: [
        "Cela dépend de l’exchange. Certains fournisseurs acceptent des montants légèrement différents et traitent la transaction au prorata. D’autres peuvent suspendre la transaction ou ne pas détecter correctement le dépôt.",
        "L’utilisateur doit toujours envoyer le montant exact affiché sur la page de statut pour éviter des retards de remboursement ou une intervention du support. La vue de statut peut également indiquer si le fournisseur sélectionné exige un montant exact.",
      ],
    },
    {
      question: "Ma transaction a échoué et je n’ai pas récupéré mes fonds. Que faire ?",
      paragraphs: [
        "Si une transaction échoue et que le remboursement n’est pas arrivé, contactez le support via les canaux indiqués par le service et incluez les détails de transaction affichés sur la page de statut.",
        "Vous pouvez aussi contacter directement l’exchange sélectionné si vous préférez, mais le support peut intervenir pour examiner le dossier et pousser vers une résolution si nécessaire.",
      ],
    },
  ],
  de: [
    {
      question: "Wie funktioniert Assetar?",
      paragraphs: [
        "Wenn du eine Transaktion ausfüllst, suchen wir über Partner-Exchanges nach den besten verfügbaren Kursen, damit du das Angebot wählen kannst, das am besten zu dir passt, und direkt mit diesem Anbieter tauschen kannst. So musst du kein Konto bei einer zentralisierten Exchange eröffnen, nur um eine einzelne Umwandlung durchzuführen.",
        "Du sendest den gewählten Betrag an die vom ausgewählten Exchange bereitgestellte Einzahlungsadresse, der Trade wird ausgeführt und die Zielwährung wird direkt an die von dir angegebene Wallet-Adresse gesendet. Das Ganze ist darauf ausgelegt, schneller und sicherer zu sein als die eigenständige Verwaltung mehrerer Exchange-Konten.",
        "Wir überwachen außerdem die Zuverlässigkeit der Kurse, Transaktionsverzögerungen, Wartungsfenster und Serverprobleme bei Partner-Exchanges, damit das Routing reibungsloser läuft und Missbrauch reduziert wird. Wenn etwas schiefgeht, kann der Support eingreifen und bei der Untersuchung helfen.",
        "Assetar stellt die Software-Schicht bereit, mit der Nutzer Exchanges vergleichen und direkt mit ihnen handeln können. Wir nehmen die Gelder zwischen den Parteien niemals entgegen, halten sie nicht und übertragen sie nicht.",
      ],
    },
    {
      question: "Warum solltest du uns vertrauen?",
      paragraphs: [
        "Der Service ist auf minimale Datenexposition ausgelegt. Logs werden nur gespeichert, wenn ein Partner-Exchange dies verlangt, und die Richtlinie jedes Anbieters wird angezeigt, bevor eine Transaktion erstellt wird.",
        "Von Assetar gespeicherte Logs werden weder verkauft noch an Dritte weitergegeben und nur einzeln bereitgestellt, wenn Strafverfolgungsbehörden eine gültige Anfrage stellen.",
        "JavaScript wird zur Verbesserung der Bedienbarkeit verwendet, etwa für Selektoren und Interaktionszustände, nicht für Fingerprinting oder Tracking von Nutzern. Für die meisten Funktionen kann die Seite auch ohne JavaScript verwendet werden, wenn du das bevorzugst.",
        "Aufträge werden nur an bekannte und zuverlässige Instant-Exchanges weitergeleitet. Diese Anbieter erhalten die Einzahlung, führen den Trade aus und senden die Gelder direkt an die von dir gewählte Zieladresse. Während des Prozesses übernehmen wir niemals die Verwahrung deiner Coins.",
      ],
    },
    {
      question: "Was ist die Assetar-Garantie?",
      paragraphs: [
        "Transaktionen, die über die Website erstellt werden, sind durch die Assetar-Garantie abgedeckt. Wenn ein Nutzer keine Gelder erhält und der ausgewählte Exchange keinen ausreichenden Nachweis für ein ungewöhnlich hohes AML-Risiko oder einen AML-Block durch den Liquiditätsanbieter liefern kann, erstattet Assetar bis zu dem für diese Route angezeigten versicherten Betrag.",
        "Die Abdeckung variiert je nach Exchange und kann über den Schild-Indikator geprüft werden, der neben jeder Exchange-Option angezeigt wird. Trades mit Exchanges der Bewertung D sind nicht abgedeckt. Ebenfalls ausgeschlossen sind Trades, die wegen eindeutig hohem AML-Risiko oder mixerbezogenen Geldern blockiert werden.",
        "Um eine Entschädigung zu beantragen, kontaktiere den Support per E-Mail oder Telegram und gib die Transaktions-ID an. Der Support wird zuerst versuchen, das Problem mit dem ausgewählten Exchange zu lösen, bevor eine Erstattung in Betracht gezogen wird.",
        "Der Lösungsprozess kann eine Woche oder länger dauern, weil dem Exchange Zeit gegeben wird, Beweise vorzulegen oder seine Untersuchung abzuschließen.",
      ],
      bullets: [
        "Die Garantie deckt keine Gelder ab, die wegen nachgewiesener AML-Probleme blockiert wurden.",
        "Der Erstattungsprozess kann eine Woche oder länger dauern, während der Fall mit dem Partner-Exchange geprüft wird.",
      ],
    },
    {
      question: "Welcher Swap-Flow ist derzeit live?",
      paragraphs: [
        "Der Standard-Modus ist der aktuell aktive Swap-Flow in der öffentlichen Oberfläche. Du gibst den Betrag ein, den du senden willst, wählst das Asset, das du erhalten möchtest, und vergleichst die besten Floating- und Fixed-Rates von Partner-Exchanges.",
        "Rechnungsähnliche Zahlungsflüsse sind im öffentlichen Swap-Widget derzeit nicht aktiv, daher zeigt die Oberfläche nur den Standard-Flow zur Routenbildung an.",
        "Der Buy/Sell-Tab wird für Fiat-On-Ramp- und Off-Ramp-Flows verwendet. Er kann weniger Krypto-Optionen als der Swap-Modus haben, aber Nutzer können manchmal über ein gängigeres Asset bridgen, wenn sie eine weniger verbreitete Coin erreichen wollen.",
      ],
    },
    {
      question: "Wie funktioniert das Fiat Gateway (Buy/Sell)?",
      paragraphs: [
        "Im Fiat-Gateway-Aggregator wählst du die Kryptowährung, die du kaufen oder verkaufen möchtest, die Fiat-Währung, die du verwenden willst, und den Betrag, den du handeln willst. Die Plattform vergleicht Kurse von Partner-Anbietern und lässt dich den bevorzugten auswählen.",
        "Je nach Währung und Anbieter können die Zahlungsmethoden Karten, Banküberweisung, Google Pay, Apple Pay, UPI, IMPS, GCash, PayMaya, GrabPay und weitere umfassen.",
        "Um den Trade abzuschließen, wirst du auf die Website des Partners weitergeleitet, die JavaScript erfordern kann. Jeder Anbieter hat seine eigene KYC- und Verifizierungspolitik, daher sollten Nutzer diese Bedingungen vor dem Fortfahren prüfen.",
        "Assetar kontrolliert die KYC-Anforderungen der Partner nicht und hat niemals Zugriff auf das übertragene Fiat oder Krypto. Der Service stellt nur die Vermittlungs- und Vergleichsschicht bereit.",
      ],
    },
    {
      question: "Wie lange dauert es, bis eine Transaktion abgeschlossen ist?",
      paragraphs: [
        "Die meisten Swaps sind in etwa 5 bis 60 Minuten abgeschlossen. Die tatsächliche Dauer hängt vor allem von der Netzwerkauslastung, der Bestätigungsgeschwindigkeit der Blockchain und der Reaktionszeit des gewählten Exchanges ab.",
        "Assets mit langsameren Bestätigungen brauchen naturgemäß länger, während schnellere Netzwerke meist früher fertig sind.",
        "Während der Auswahl des Exchanges wird eine ungefähre ETA auf Basis der jüngeren Anbieterhistorie angezeigt, was Nutzern hilft, zwischen schnelleren und langsameren Routen zu wählen.",
      ],
    },
    {
      question: "Welche Gebühren sind in den angezeigten Kursen enthalten?",
      paragraphs: [
        "Die angezeigten Kurse enthalten bereits Netzwerk-Transaktionsgebühren und Exchange-Gebühren. Es wird kein zusätzlicher Aufschlag dafür berechnet, dass du den Aggregator statt des direkten Weges zum ausgewählten Exchange nutzt.",
        "Größere Transaktionen liefern oft bessere effektive Kurse, weil feste Netzwerkgebühren auf einen größeren Betrag verteilt werden.",
        "Die Plattform erhält eine Provision für Referrals, aber diese stammt aus der Exchange-Gebühr und verändert den dem Nutzer angezeigten Kurs nicht.",
        "Floating-Rate-Angebote auf dem Exchange-Auswahlbildschirm können angepasst werden, um die erwartete endgültige Auszahlung mithilfe der jüngeren Ausführungshistorie jedes Exchanges besser abzubilden. Der Statusbildschirm zeigt später den tatsächlich vom Exchange gemeldeten Kurs an.",
      ],
    },
    {
      question: "Ist das wirklich privat? Ist KYC nicht erforderlich?",
      paragraphs: [
        "Jeder Exchange hat seine eigene KYC- und AML-Richtlinie. Ein Anbieter kann eine Transaktion stoppen und vor dem Abschluss eine Verifizierung verlangen, insbesondere wenn die Einzahlung eine Risikoüberprüfung auslöst.",
        "Partner-Exchanges führen eine Prüfung eingehender Gelder durch. Nutzer werden davor gewarnt, Gelder mit sehr hohem AML-Risiko oder Gelder aus Mixern oder illegalen Aktivitäten zu senden, da solche Routen wahrscheinlich abgelehnt werden.",
        "Um den Vergleich zu erleichtern, weist die Plattform jedem Exchange eine einfache KYC- und AML-Bewertung auf Basis der Richtlinien, direkter Antworten der Anbieter, des Umgangs mit Erstattungen und der bisherigen Historie auf Assetar zu.",
        "Einige Exchanges verlangen außerdem, dass Logs wie IP, User Agent oder Accept-Language bei Assetar gespeichert werden. Diese Anforderungen werden auf dem Exchange-Bildschirm offengelegt, bevor ein Trade erstellt wird.",
      ],
      bullets: [
        "A: Nutzt eigene Liquidität und ist privacy-friendly.",
        "B: Erstattet die meisten Transaktionen, die AML-Prüfungen nicht bestehen, außer in seltenen Fällen von Rechtsanordnungen oder gestohlenen Geldern.",
        "C: Erstattet gescheiterte AML-Prüfungen normalerweise, aber Überprüfungen des Liquiditätsanbieters können trotzdem KYC oder eine Herkunftsprüfung der Gelder verlangen.",
        "D: Blockiert gescheiterte AML-Prüfungen, bis KYC oder eine Herkunftsprüfung der Gelder bestanden wurde.",
      ],
    },
    {
      question: "Warum erscheinen nur wenige Exchanges als Optionen für meinen Trade?",
      paragraphs: [
        "Einige Exchanges unterstützen sehr kleine Trades, aber viele setzen höhere Mindestbeträge, weil Netzwerkgebühren die Wirtschaftlichkeit winziger Swaps zerstören können. Wenn du nur Kurse prüfst, verwende einen Betrag, der nahe an dem liegt, den du tatsächlich handeln willst.",
        "Die Verfügbarkeit kann sich auch einschränken, wenn du direkt zwischen zwei weniger verbreiteten Assets tauschst. In solchen Fällen kann das Routing über eine liquidere Zwischenwährung mehr Anbieteroptionen eröffnen.",
      ],
    },
    {
      question: "Was ist der Unterschied zwischen Floating und Fixed Rate?",
      paragraphs: [
        "Ein Floating-Kurs ist eine Schätzung. Nachdem der Exchange deine Einzahlung bestätigt hat, berechnet er den Trade anhand der aktuellen Marktbedingungen neu. Wenn sich der Markt deutlich bewegt hat, fragen manche Anbieter, ob du mit dem neuen Kurs fortfahren oder eine Erstattung anfordern möchtest.",
        "Floating-Kurse sind meist besser für normale Umwandlungen, bei denen du den zu sendenden Betrag bereits kennst. Sie sind in der Regel wettbewerbsfähiger als Fixed-Kurse.",
        "Fixed-Kurse sind nützlicher, wenn der Auszahlungsbetrag exakt sein muss, etwa beim Bezahlen einer Rechnung. Du sperrst den Betrag der Sendewährung, der nötig ist, um eine bestimmte Menge der Zielwährung zu erhalten.",
        "Selbst Fixed-Rate-Angebote können noch erstattet werden, wenn sich der Markt zu stark bewegt, bevor der Anbieter die Transaktion bestätigen kann. Es ist am besten, die Wallet vor der Bestätigung bereitzuhalten, damit das Angebot nicht verfällt.",
      ],
    },
    {
      question: "Was passiert, wenn ich den falschen Betrag an die angegebene Adresse sende?",
      paragraphs: [
        "Das hängt vom Exchange ab. Einige Anbieter akzeptieren leicht abweichende Beträge und führen den Trade proportional aus. Andere können die Transaktion anhalten oder die Einzahlung nicht sauber erkennen.",
        "Nutzer sollten immer den exakten auf der Statusseite angezeigten Betrag senden, um Verzögerungen bei Erstattungen oder Support-Eingriffe zu vermeiden. Die Statusansicht kann außerdem anzeigen, ob der ausgewählte Anbieter exakte Beträge verlangt.",
      ],
    },
    {
      question: "Meine Transaktion ist fehlgeschlagen und ich habe meine Gelder nicht zurückbekommen. Was soll ich jetzt tun?",
      paragraphs: [
        "Wenn eine Transaktion fehlschlägt und die Erstattung nicht angekommen ist, kontaktiere den Support über die vom Service angegebenen Kanäle und füge die auf der Statusseite gezeigten Transaktionsdetails bei.",
        "Du kannst auch direkt den ausgewählten Exchange kontaktieren, wenn du das bevorzugst, aber der Support kann bei der Prüfung des Falls helfen und bei Bedarf auf eine Lösung drängen.",
      ],
    },
  ],
  zh: [
    {
      question: "Assetar 是如何运作的？",
      paragraphs: [
        "当你填写一笔交易时，我们会在合作交易所之间搜索当前可用的最佳汇率，让你可以选择最适合自己的报价，并直接与该提供商完成兑换。这样你就不必为了单次转换去注册中心化交易所账户。",
        "你将所选金额发送到所选交易所提供的充值地址，交易会被处理，目标币种会直接发送到你填写的钱包地址。这样的设计比自己维护多个交易所账户更快也更安全。",
        "我们还会监控合作交易所的汇率可靠性、交易延迟、维护窗口以及服务器问题，以便让路由更顺畅并减少滥用。如果出现问题，支持团队可以介入并帮助排查。",
        "Assetar 提供的是让用户比较交易所并直接与其交易的软件层。我们从不接收、持有或在双方之间转移资金。",
      ],
    },
    {
      question: "为什么要信任我们？",
      paragraphs: [
        "这项服务围绕最小化数据暴露来设计。只有当合作交易所要求时才会保留日志，而且每个提供商的政策都会在交易创建前展示出来。",
        "Assetar 存储的日志不会被出售或共享给第三方，只有在执法机构提出有效请求时才会按个案提供。",
        "JavaScript 只用于提升可用性，例如选择器和交互状态，而不是用于指纹识别或追踪用户。对于大多数功能，如果你愿意，网站在没有 JavaScript 的情况下仍然可以使用。",
        "订单只会被路由到已知且可靠的即时交易所。这些提供商接收充值、执行交易，并把资金直接发送到你选择的目标地址。整个过程中我们从不托管你的币。",
      ],
    },
    {
      question: "什么是 Assetar 保证？",
      paragraphs: [
        "通过网站创建的交易受 Assetar 保证保护。如果用户没有收到资金，而所选交易所又无法提供足够证据证明存在异常高的 AML 风险或流动性提供商 AML 拦截，Assetar 将按该路线显示的保障额度进行赔付。",
        "保障范围因交易所而异，可以通过每个交易所选项旁边显示的盾牌标识查看。评级为 D 的交易所不在保障范围内。因明显高 AML 风险或与 mixer 有关资金而被拦截的交易也不在保障范围内。",
        "如需申请赔付，请通过电子邮件或 Telegram 联系支持团队，并附上交易 ID。支持团队会先尝试与所选交易所解决问题，然后才会考虑赔付。",
        "解决流程可能需要一周甚至更久，因为需要给交易所时间提供证据或完成调查。",
      ],
      bullets: [
        "该保证不覆盖因已证实的 AML 问题而被拦截的资金。",
        "在与合作交易所审查案件期间，退款流程可能需要一周或更长时间。",
      ],
    },
    {
      question: "当前公开可用的是哪种兑换流程？",
      paragraphs: [
        "标准模式是当前公开界面中正在使用的兑换流程。你输入计划发送的金额，选择想接收的资产，然后比较合作交易所提供的最佳浮动与固定汇率。",
        "发票式支付流程目前没有在公开兑换组件中启用，因此界面现在只显示标准的路线构建流程。",
        "Buy/Sell 标签用于法币入金和出金流程。它可用的加密资产选项可能比兑换模式更少，但如果用户需要到达较少见的币种，有时可以先通过更常见的资产进行桥接。",
      ],
    },
    {
      question: "Fiat Gateway（Buy/Sell）是如何运作的？",
      paragraphs: [
        "在 Fiat Gateway 聚合器中，你可以选择要买入或卖出的加密货币、要使用的法币以及交易金额。平台会比较合作提供商的汇率，并让你选择自己偏好的那个。",
        "根据货币和提供商的不同，支付方式可能包括银行卡、银行转账、Google Pay、Apple Pay、UPI、IMPS、GCash、PayMaya、GrabPay 等。",
        "为了完成交易，你会被重定向到合作方网站，该网站可能需要 JavaScript。每个提供商都有自己的 KYC 和验证政策，因此用户在继续之前应查看相关条款。",
        "Assetar 不控制合作方的 KYC 要求，也从不接触被转移的法币或加密货币。该服务只提供比较与跳转层。",
      ],
    },
    {
      question: "完成一笔交易通常需要多长时间？",
      paragraphs: [
        "大多数兑换会在大约 5 到 60 分钟内完成。实际耗时主要取决于网络拥堵、区块链确认速度以及所选交易所的响应时间。",
        "确认较慢的资产自然需要更长时间，而较快的网络通常会更早完成。",
        "在选择交易所时，系统会根据提供商的近期历史显示一个大致 ETA，帮助用户在较快和较慢的路线之间做选择。",
      ],
    },
    {
      question: "显示的汇率中包含哪些费用？",
      paragraphs: [
        "显示的报价已经包含网络交易费和交易所手续费。使用聚合器而不是直接去所选交易所，并不会额外加收费用。",
        "较大的交易通常会得到更好的实际汇率，因为固定网络手续费会被摊到更大的金额上。",
        "平台会从推荐中获得佣金，但这部分来自交易所手续费，不会改变用户看到的报价。",
        "在交易所选择页面显示的浮动报价可以根据每个交易所近期的执行历史进行调整，以更贴近预期最终到账金额。之后的状态页会显示交易所实际报告的汇率。",
      ],
    },
    {
      question: "这真的私密吗？不是需要 KYC 吗？",
      paragraphs: [
        "每个交易所都有自己的 KYC 和 AML 政策。提供商可能会在完成交易前暂停交易并要求验证，尤其是在充值触发风险审查时。",
        "合作交易所会对入账资金进行尽职调查。系统会提醒用户不要发送 AML 风险很高的资金，也不要发送与 mixers 或非法活动相关的资金，因为这些路线很可能会被拒绝。",
        "为了便于比较，平台会根据交易所政策、提供商直接回复、退款处理方式以及在 Assetar 上的历史记录，为每个交易所给出简单的 KYC 和 AML 评级。",
        "有些交易所还要求在 Assetar 保留 IP、user agent 或 accept-language 等日志。这些要求会在交易创建前在交易所页面中披露。",
      ],
      bullets: [
        "A：使用自有流动性，并且更偏向隐私友好。",
        "B：对大多数未通过 AML 检查的交易会退款，只有极少数法律命令或被盗资金案例除外。",
        "C：通常会退还未通过 AML 检查的交易，但流动性提供商审查仍可能要求 KYC 或资金来源验证。",
        "D：对未通过 AML 检查的交易会一直拦截，直到 KYC 或资金来源验证通过。",
      ],
    },
    {
      question: "为什么我的交易只出现少数几个交易所选项？",
      paragraphs: [
        "有些交易所支持很小额的交易，但很多交易所设置了更高的最低金额，因为网络手续费会让极小额兑换失去经济意义。如果你只是查看汇率，请使用接近你实际计划交易的金额。",
        "当你直接在两个较少见的资产之间兑换时，可用选项也可能变少。在这种情况下，通过流动性更强的中间币种进行路由，往往可以打开更多提供商选项。",
      ],
    },
    {
      question: "Floating Rate 和 Fixed Rate 有什么区别？",
      paragraphs: [
        "浮动汇率只是一个估算值。在交易所确认你的充值之后，它会根据实时市场情况重新计算这笔交易。如果市场变化较大，某些提供商可能会询问你是继续按新汇率执行，还是申请退款。",
        "浮动汇率通常更适合普通转换场景，也就是你已经知道自己要发送多少金额的时候。它们通常比固定汇率更有竞争力。",
        "固定汇率更适合到账金额必须精确的场景，例如支付发票。你会锁定为获得某个目标币种精确数量所需发送的源币数量。",
        "即便是固定汇率报价，如果市场在提供商确认交易之前波动过大，也仍然可能被退款。最好在确认之前就准备好钱包，以免报价过期。",
      ],
    },
    {
      question: "如果我向提供的地址发送了错误的金额，会发生什么？",
      paragraphs: [
        "这取决于交易所。有些提供商接受略有差异的金额，并按比例完成交易；另一些则可能暂停交易，或者无法正确识别这笔充值。",
        "用户应始终发送状态页上显示的准确金额，以避免退款延迟或需要支持介入。状态页也可能显示所选提供商是否要求精确金额。",
      ],
    },
    {
      question: "我的交易失败了，但资金还没有退回。我现在该怎么办？",
      paragraphs: [
        "如果交易失败且退款尚未到账，请通过服务提供的支持渠道联系支持团队，并附上状态页中显示的交易详情。",
        "如果你愿意，也可以直接联系所选交易所，但支持团队也可以介入帮助审查案件，并在需要时推动解决。",
      ],
    },
  ],
};

export default function FaqSection() {
  const { t, locale } = useLocale();
  const faqItems = createMemo(() => faqItemsByLocale[(locale() as SupportedLocale)] ?? faqItemsByLocale.en);

  return (
    <section class="faq-section" id="faq">
      <div class="faq-section__intro">
        <p class="faq-section__eyebrow">{t('faq.eyebrow')}</p>
        <h2 class="faq-section__title">{t('faq.title')}</h2>
        <p class="faq-section__summary">{t('faq.summary')}</p>

        <div class="faq-section__support-card">
          <p class="faq-section__support-kicker">{t('faq.supportKicker')}</p>
          <p class="faq-section__support-copy">{t('faq.supportCopy')}</p>
        </div>
      </div>

      <div class="faq-section__list">
        <For each={faqItems()}>
          {(item, index) => (
            <details class="faq-item" open={index() === 0}>
              <summary class="faq-item__summary">
                <span class="faq-item__question">{item.question}</span>
                <span class="faq-item__icon" aria-hidden="true" />
              </summary>

              <div class="faq-item__body">
                <For each={item.paragraphs}>
                  {paragraph => <p class="faq-item__copy">{paragraph}</p>}
                </For>

                {item.bullets ? (
                  <ul class="faq-item__bullets">
                    <For each={item.bullets}>
                      {bullet => <li class="faq-item__bullet">{bullet}</li>}
                    </For>
                  </ul>
                ) : null}
              </div>
            </details>
          )}
        </For>
      </div>
    </section>
  );
}
