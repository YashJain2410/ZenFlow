export interface Mantra {
  id: string;
  title: string;
  tradition: string;
  originalScript?: string;
  transliteration: string;
  phonetic: string;
  meaning: string;
  intention: string;
  cadenceSeconds: number;
  isCustom?: boolean;
}

export const PREDEFINED_MANTRAS: Mantra[] = [
  {
    id: 'om',
    title: 'Om (Aum)',
    tradition: 'Universal Stillness',
    originalScript: 'ॐ',
    transliteration: 'Om (Aum)',
    phonetic: 'A - U - M (prolonged soft resonance in chest & brow)',
    meaning: 'The primordial vibration of universal presence, wholeness, and foundational silence.',
    intention: 'Centering chaotic thoughts and grounding the body.',
    cadenceSeconds: 6,
  },
  {
    id: 'so_hum',
    title: 'So Hum',
    tradition: 'Natural Breath Awareness',
    originalScript: 'सो ऽहम्',
    transliteration: 'So Hum',
    phonetic: '"So" gently inhaled through the nose ... "Hum" softly released',
    meaning: '"I am That" — the natural sound of inhalation and exhalation reminding us of our effortless bond with life.',
    intention: 'Encouraging a steady breath and returning to spontaneous presence.',
    cadenceSeconds: 5,
  },
  {
    id: 'om_shanti',
    title: 'Om Shanti',
    tradition: 'Peace Invocation',
    originalScript: 'ॐ शान्तिः शान्तिः शान्तिः',
    transliteration: 'Om Shāntiḥ Shāntiḥ Shāntiḥ',
    phonetic: 'Ohm Shahn-tee, Shahn-tee, Shahn-tee',
    meaning: 'Threefold peace: calming physical agitation, easing verbal restlessness, and soothing the turbulent mind.',
    intention: 'Easing feelings of overwhelm and creating an inner sanctuary of quiet.',
    cadenceSeconds: 7,
  },
  {
    id: 'gayatri',
    title: 'Gayatri Mantra',
    tradition: 'Vedic Illumination',
    originalScript: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    transliteration: 'Om Bhūr Bhuvaḥ Svaḥ Tat Savitur Vareṇyaṃ Bhargo Devasya Dhīmahi Dhiyo Yo Naḥ Pracodayāt',
    phonetic: 'Om Bhoor Bhoo-vah Swa-ha, Tat Sa-vi-toor Vuh-ren-yum, Bhar-go Day-vus-yuh Dhee-mu-hee, Dhi-yo Yo Nuh Pruh-cho-duh-yaht',
    meaning: 'We honor the radiant supreme light that nourishes all existence; may that gentle radiance illuminate our mind and dispel inner shadows.',
    intention: 'Awakening clarity, uplifting mood, and softening feelings of helplessness.',
    cadenceSeconds: 12,
  },
  {
    id: 'maha_mrityunjaya',
    title: 'Maha Mrityunjaya Mantra',
    tradition: 'Healing & Protection',
    originalScript: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान् मृत्योर्मुक्षीय मामृतात्',
    transliteration: 'Om Tryambakaṃ Yajāmahe Sugandhiṃ Puṣṭi-vardhanam Urvārukam-iva Bandhanān Mṛtyor-mukṣīya Māmṛtāt',
    phonetic: 'Om Tryum-buh-kum Yuh-jah-mu-hay, Soo-gun-dhim Poosh-ti-vur-dhuh-num, Oor-vah-roo-kum-ee-vuh Bundh-uh-nahn, Mrit-yor Mook-shee-yuh Mah-mri-taht',
    meaning: 'We honor the nourishing, compassionate presence in nature. Like a sweet melon effortlessly parting from the vine when ripe, may we be gently freed from fear and returned to everlasting vitality.',
    intention: 'Deep emotional protection, releasing fear, and cultivating resilience.',
    cadenceSeconds: 14,
  },
  {
    id: 'lokah_samastah',
    title: 'Lokah Samastah',
    tradition: 'Universal Benevolence',
    originalScript: 'लोकाः समस्ताः सुखिनो भवन्तु',
    transliteration: 'Lokāḥ Samastāḥ Sukhino Bhavantu',
    phonetic: 'Lo-kah Sum-us-tah Soo-khee-no Bhuh-vun-too',
    meaning: 'May all beings everywhere be happy, peaceful, and free from suffering.',
    intention: 'Shifting attention gently away from isolated dread toward warm, interconnected compassion.',
    cadenceSeconds: 8,
  },
  {
    id: 'metta_peace',
    title: 'Loving-Kindness (Metta)',
    tradition: 'Contemplative Kindness',
    originalScript: 'अवेरा होन्तु, सुखी अत्तानं परिहरन्तु',
    transliteration: 'May I be peaceful. May I be safe. May I be well.',
    phonetic: 'Speak or hold softly in the heart at your natural pace',
    meaning: 'A warm, unconditional blessing of inner security, bodily ease, and emotional kindness toward oneself.',
    intention: 'Soothing self-blame, nervous exhaustion, and sensory overload.',
    cadenceSeconds: 8,
  },
];

export const DURATION_OPTIONS = [
  { label: '2 min', seconds: 120, description: 'Quick grounding reset' },
  { label: '5 min', seconds: 300, description: 'Balanced calm practice' },
  { label: '10 min', seconds: 600, description: 'Deep tranquil immersion' },
  { label: '15 min', seconds: 900, description: 'Extended spiritual stillness' },
];
