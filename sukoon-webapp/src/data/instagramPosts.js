// Real Instagram posts to surface in the Library, manually curated and
// tagged by journey. Instagram has no public API to auto-classify what a
// post is about, so this is a hand-maintained list -- add an entry here
// whenever you publish a post you want to feature in-app. journeyIds: []
// means "show to everyone", not "show to nobody".
//
// permalink must be the post's own URL, e.g.
// "https://www.instagram.com/p/C1a2B3cDeFg/" (the /reel/... form works too)
// -- copy it from the "Copy Link" option on the post itself. The post must
// be public (not a private account) for the embed to render for visitors
// who aren't logged into Instagram.
export const INSTAGRAM_POSTS = [
  {
    id: "woodhousehealthcare-demo-1",
    journeyIds: [],
    permalink: "https://www.instagram.com/woodhousehealthcare/reel/Czk2GtMvugA/",
  },
  {
    id: "woodhousehealthcare-demo-2",
    journeyIds: [],
    permalink: "https://www.instagram.com/woodhousehealthcare/reel/DZ9xhEGhOrb/",
  },
  {
    id: "woodhousehealthcare-demo-3",
    journeyIds: [],
    permalink: "https://www.instagram.com/woodhousehealthcare/reel/DaNcoymTWMx/",
  },
];

export function instagramPostsForJourneys(journeyIds, limit) {
  const matches = INSTAGRAM_POSTS.filter(
    (post) => !post.journeyIds.length || post.journeyIds.some((j) => journeyIds?.includes(j))
  );
  return typeof limit === "number" ? matches.slice(0, limit) : matches;
}
