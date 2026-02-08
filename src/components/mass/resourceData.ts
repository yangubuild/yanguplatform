export interface Resource {
  image: string;
  title: string;
  category: string;
  featured?: boolean;
  url?: string;
}

export const featuredResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/LnXUeoRLtFdfqGFphNz2RHNZVk.jpg?width=2400&height=1800",
    title: "Gramerz",
    category: "Inspiration",
    featured: true,
    url: "https://gramerz.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/bE2r4D8FDICBHISLhFehg0fZvI.jpg?width=2400&height=1800",
    title: "Jobhunt",
    category: "Templates",
    featured: true,
    url: "https://jobhunt.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/kRIOHbPRgtbfe4Z0NlK2qSiO5Q.jpg?width=1200&height=900",
    title: "Homfort",
    category: "Templates",
    featured: true,
    url: "https://homfort.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/lFB33SIMWsogDBI02316XDG3tfc.jpg?width=1200&height=900",
    title: "Dwello",
    category: "Templates",
    featured: true,
    url: "https://dwello.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/kUNPmKVFYs9FN6p19KwE8pNZdA.png?width=278&height=181",
    title: "Mobbin",
    category: "Inspiration",
    featured: true,
    url: "https://mobbin.com/",
  },
  {
    image: "https://framerusercontent.com/images/NgkQ2uqwhqhzp1GpuNpksVYeAE.png?width=2920&height=1602",
    title: "Runway",
    category: "Ai",
    featured: true,
    url: "https://runwayml.com/",
  },
  {
    image: "https://framerusercontent.com/images/mEAxnN029jRMMnVb24MVnsrUeHE.jpeg?width=1600&height=1085",
    title: "Learnfy",
    category: "Templates",
    featured: true,
    url: "https://learnfy.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/O1XE3m9LcBRskOvexF1hpVFrTxc.jpg?width=1208&height=840",
    title: "Crate",
    category: "Templates",
    featured: true,
    url: "https://crate.framer.website/",
  },
];

export const inspirationResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/LnXUeoRLtFdfqGFphNz2RHNZVk.jpg?width=2400&height=1800",
    title: "Gramerz",
    category: "Inspiration",
    url: "https://gramerz.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/kUNPmKVFYs9FN6p19KwE8pNZdA.png?width=278&height=181",
    title: "Mobbin",
    category: "Inspiration",
    url: "https://mobbin.com/",
  },
  {
    image: "https://framerusercontent.com/images/xgZmgz5YDwDdQhd0RLniNpa6nU.png?width=225&height=225",
    title: "One Page Love",
    category: "Inspiration",
    url: "https://onepagelove.com/",
  },
  {
    image: "https://framerusercontent.com/images/1WrG0jJrNIsQcp6GDSNXBKwzAgo.jpg?width=600&height=600",
    title: "Site Inspire",
    category: "Inspiration",
    url: "https://www.siteinspire.com/",
  },
  {
    image: "https://framerusercontent.com/images/V3PExwvRrGWwqJNS52QyqgcNU.jpg?width=686&height=386",
    title: "Product Hunt",
    category: "Inspiration",
    url: "https://www.producthunt.com/",
  },
  {
    image: "https://framerusercontent.com/images/mxpH3gXSqTcbKEAbJtoDTvVxoa4.jpg?width=600&height=600",
    title: "Awwwards",
    category: "Inspiration",
    url: "https://www.awwwards.com/",
  },
];

export const noCodeResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/jjVzS6V0rxaPtwgro5T0jtT1SU.webp?width=480&height=480",
    title: "Bravo Studio",
    category: "No Code",
    url: "https://bravostudio.app/",
  },
  {
    image: "https://framerusercontent.com/images/LPLJLjZ9YP6IDi5Y38zeDr0Yhk.png?width=1280&height=669",
    title: "Adalo",
    category: "No Code",
    url: "https://adalo.com/",
  },
  {
    image: "https://framerusercontent.com/images/vRKHvYWGkrco7ma8f6v0qd6Zd6U.webp?width=1920&height=1080",
    title: "Webflow",
    category: "No Code",
    url: "https://webflow.com/",
  },
  {
    image: "https://framerusercontent.com/images/QxoRb0hyzjhf04lfada38CWDQ.webp?width=900&height=900",
    title: "BuildShip",
    category: "No Code",
    url: "https://buildship.com/",
  },
  {
    image: "https://framerusercontent.com/images/1EYuHNLIZfd3KPA2YNNQ3SExdQ.png?width=2200&height=1155",
    title: "Voiceflow",
    category: "No Code",
    url: "https://www.voiceflow.com/",
  },
  {
    image: "https://framerusercontent.com/images/e08XkYTDTj364yoqwtnAc4aJFs.webp?width=1920&height=1080",
    title: "Glide",
    category: "No Code",
    url: "https://glideapps.com/",
  },
  {
    image: "https://framerusercontent.com/images/PnnqkVgF0MoMLyv4nvZk7qwI.webp?width=200&height=200",
    title: "FlutterFlow",
    category: "No Code",
    url: "https://flutterflow.io/",
  },
  {
    image: "https://framerusercontent.com/images/HK6KSLTZ1lO0yslbw7PLMLK5o7k.webp?width=900&height=460",
    title: "Airtable",
    category: "No Code",
    url: "https://www.airtable.com/",
  },
];

export const templatesResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/3nk8HG5ItlAWCv0U6jySow4IEFQ.jpg?width=2400&height=1800",
    title: "Seis",
    category: "Templates",
    url: "https://seis.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/bE2r4D8FDICBHISLhFehg0fZvI.jpg?width=2400&height=1800",
    title: "Jobhunt",
    category: "Templates",
    url: "https://jobhunt.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/Nzdiy3XNG5dC2jF8fhxfL0mNwgs.jpg?width=2400&height=1800",
    title: "Treq",
    category: "Templates",
    url: "https://treq.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/p0R2sbIk02iPvix3d6dTG9Jo8aQ.png?width=2400&height=1800",
    title: "Hedge",
    category: "Templates",
    url: "https://hedge.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/vYO2Q9qJlYGeNAZb3QvlMHc64sY.jpg?width=1200&height=900",
    title: "Inndigo",
    category: "Templates",
    url: "https://inndigo.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/kRIOHbPRgtbfe4Z0NlK2qSiO5Q.jpg?width=1200&height=900",
    title: "Homfort",
    category: "Templates",
    url: "https://homfort.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/lFB33SIMWsogDBI02316XDG3tfc.jpg?width=1200&height=900",
    title: "Dwello",
    category: "Templates",
    url: "https://dwello.framer.website/",
  },
  {
    image: "https://framerusercontent.com/images/mEAxnN029jRMMnVb24MVnsrUeHE.jpeg?width=1600&height=1085",
    title: "Learnfy",
    category: "Templates",
    url: "https://learnfy.framer.website/",
  },
];

export const aiResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/iC27oS3MuMxHlirXF2aX4OwR4.jpg?width=686&height=386",
    title: "design.ai",
    category: "Ai",
    url: "https://designs.ai/",
  },
  {
    image: "https://framerusercontent.com/images/NgkQ2uqwhqhzp1GpuNpksVYeAE.png?width=2920&height=1602",
    title: "Runway",
    category: "Ai",
    url: "https://runwayml.com/",
  },
  {
    image: "https://framerusercontent.com/images/jk8g42padnAY0o4tKhbV4kdzf1o.png?width=1920&height=1080",
    title: "Dall-E",
    category: "Ai",
    url: "https://openai.com/",
  },
  {
    image: "https://framerusercontent.com/images/NOZs9Jd135hsIVpEMdnSvE4qIk.png?width=800&height=800",
    title: "Canva",
    category: "Ai",
    url: "https://www.canva.com/",
  },
  {
    image: "https://framerusercontent.com/images/Y9fiyZpn4qkBDzGhQdc9fba9vSM.png?width=2560&height=1707",
    title: "Jasper.ai",
    category: "Ai",
    url: "https://www.jasper.ai/",
  },
  {
    image: "https://framerusercontent.com/images/owETFKhMJo9D1KuJk6xgJWNlL0.jpg?width=717&height=478",
    title: "Adobe Firefly",
    category: "Ai",
    url: "https://adobe.com/",
  },
  {
    image: "https://framerusercontent.com/images/9BKk3iSbRxIZ9rhvAsbBx5YdAak.png?width=1200&height=650",
    title: "Uizard",
    category: "Ai",
    url: "https://uizard.io/",
  },
  {
    image: "https://framerusercontent.com/images/SlX28zZGsaeYtT1j6QA7ZGUtYM.png?width=2000&height=1000",
    title: "Midjourney",
    category: "Ai",
    url: "https://midjournery.com/",
  },
];

export const typographyResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/FlhlTNQ6AjAnv5C3rBkmtZpVk.webp?width=1200&height=800",
    title: "Noto Emoji",
    category: "Typography",
    url: "https://fonts.google.com/noto/specimen/Noto+Emoji",
  },
  {
    image: "https://framerusercontent.com/images/CqpYAdVfkpH6JV78fjcvKWQn7s.png?width=1024&height=681",
    title: "SUSE",
    category: "Typography",
    url: "https://fonts.google.com/specimen/SUSE",
  },
  {
    image: "https://framerusercontent.com/images/J1UeN1SbnnVYkfErop1BGhr6u8.jpg?width=741&height=415",
    title: "Instrument Serif",
    category: "Typography",
    url: "https://fonts.google.com/specimen/Instrument+Serif",
  },
  {
    image: "https://framerusercontent.com/images/L5tdN9voLwxA0LNCEUIe0c7ToKc.webp?width=768&height=432",
    title: "Bricolage Grotesque",
    category: "Typography",
    url: "https://fonts.google.com/specimen/Bricolage+Grotesque",
  },
  {
    image: "https://framerusercontent.com/images/9ZmCvO8AMq4kGx9gyGXxYjHeT9M.png?width=3200&height=2400",
    title: "Lato",
    category: "Typography",
    url: "https://fonts.google.com/specimen/Lato",
  },
  {
    image: "https://framerusercontent.com/images/BoinieSGipyjDZoGBKgmAAB6M.webp?width=1920&height=1920",
    title: "Schibsted Grotesk",
    category: "Typography",
    url: "https://fonts.google.com/specimen/Schibsted+Grotesk",
  },
];

export const designToolsResources: Resource[] = [
  {
    image: "https://framerusercontent.com/images/qZoq8Dpi0EnsgM2Eq83XQznjBh0.jpeg?width=960&height=500",
    title: "Spline",
    category: "Design Tools",
    url: "https://spline.design/",
  },
  {
    image: "https://framerusercontent.com/images/jdVKZKJRJlnd9LYwBlsWA5eA.webp?width=2000&height=2000",
    title: "Rive",
    category: "Design Tools",
    url: "https://rive.app/",
  },
  {
    image: "https://framerusercontent.com/images/Pk1iSrOQU8CUBOGoBgQK5BBTrQ.png?width=225&height=225",
    title: "Jitter",
    category: "Design Tools",
    url: "https://jitter.video/",
  },
  {
    image: "https://framerusercontent.com/images/r0QJn0uhrvF4URUliaRo0yT3M.png?width=1400&height=612",
    title: "Lottie",
    category: "Design Tools",
    url: "https://lottiefiles.com/",
  },
  {
    image: "https://framerusercontent.com/images/3lQ13d5SlHQKLMZfw4eYCh076I.png?width=1200&height=630",
    title: "Penpot",
    category: "Design Tools",
    url: "https://www.penpot.app/",
  },
  {
    image: "https://framerusercontent.com/images/42ShomEpp7guOys6ZNat24U.png?width=252&height=200",
    title: "UXPin",
    category: "Design Tools",
    url: "https://uxpin.com/",
  },
  {
    image: "https://framerusercontent.com/images/EsVxhA1OMyzUgiR9DOkn5vLsKFk.jpg?width=1200&height=853",
    title: "Figma",
    category: "Design Tools",
    url: "https://figma.com/",
  },
];
