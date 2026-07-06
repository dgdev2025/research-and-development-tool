# Weekly Research & Dev — Week 26, 2026
*22 June 2026 – 28 June 2026*
*Internal use only · Digital Goliath*

---

## Top Stories This Week

- **Smart Campaigns API sunset is official.** Google is ending new Smart Campaign creation via the Ads API, forcing full migration to PMax. Any internal scripts or tools touching Smart Campaigns need auditing now. ([Search Engine Land](https://searchengineland.com/google-ads-api-to-stop-supporting-new-smart-campaign-creation-480999))
- **ChatGPT CPC ads are live and showing strong engagement signals.** SimilarWeb data shows ChatGPT-referred visitors view ~2x more pages and spend ~2x longer on-site vs. standard referral traffic. Ad dismissal rates have dropped 50% as relevance improves. This is no longer a watch-and-wait channel. ([Search Engine Land](https://searchengineland.com/chatgpt-recommendations-brand-website-visits-study-480989) · [Search Engine Land](https://searchengineland.com/openai-says-chatgpt-ad-dismissals-have-dropped-50-as-relevance-improves-480991))
- **Gemini is now Google's explicit brand narrative for PMax and Search.** GML 2026 messaging frames the platform's entire future around Gemini — "our Gemini advantage is your business advantage." The consolidation of campaign types under AI is accelerating, not slowing. ([YouTube](https://www.youtube.com/watch?v=Z7dY8uRfkGo) · [YouTube](https://www.youtube.com/watch?v=EtGd3DpI5uA))
- **Meta's Andromeda era is reshaping campaign structure fundamentals.** PPC Hero argues complex audience segmentation is now counterproductive — Meta's AI finds the right people better than manual builds do. Structural simplification is the new best practice. ([PPC Hero](https://ppchero.com/meta-campaign-structure-in-andromeda-era/))
- **Cross-channel attribution remains the #1 budget protection problem.** Search Engine Land published a dedicated methodology piece on measuring paid social's halo effect on paid search — critical reading for any client conversation about cutting Meta spend. ([Search Engine Land](https://searchengineland.com/measure-paid-social-impact-paid-search-performance-480936))

---

## Google Ads Changes

**Smart Campaigns API Sunset**
Google is formally ending API support for new Smart Campaign creation, pushing all automation toward PMax. Hard deprecation timeline not published yet but the direction is irreversible. ([Search Engine Land](https://searchengineland.com/google-ads-api-to-stop-supporting-new-smart-campaign-creation-480999))

**AI Max Now Live for Search**
AI Max is rolling out for Search campaigns. PPC Hero has a dedicated breakdown of what it is, what it changes, and whether accounts are actually ready for it. Establish a testing protocol that isolates its impact before recommending to clients. ([PPC Hero](https://ppchero.com/google-ai-max-what-it-is-what-it-does-and-whether-your-account-is-actually-ready/))

**"Strongest Match" Labels Being Tested on Search Ads**
Google is testing a "Strongest Match" label on Search ads to highlight the most relevant result. Mechanism and eligibility criteria not yet confirmed — worth monitoring for RSA and asset quality implications. ([Search Engine Journal](https://www.searchenginejournal.com/google-strongest-match-search-ad-labels-test/580378/) · [Search Engine Land](https://searchengineland.com/google-tests-strongest-match-labels-on-search-ads-480978))

**RSA Pinning Guidance Updated**
Google has updated its RSA help docs with enhanced pinning guidelines. Pinning identical or similar text now flagged as an Ad Strength risk. Recommended approach: pin 1–2 essential messages, leave remaining positions unpinned. Audit any accounts with aggressive pinning strategies. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/google-ads-tips-pinning-headlines-descriptions/))

**Server-to-Server Conversion Measurement Improved**
Google has updated S2S conversion tracking to recover previously undercounted conversions by joining server-side data with parallel browser signals (cookies) when a GCLID is present. If any clients run S2S setups, check whether reported conversion volume has shifted. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/improved-measurement-server-to-server-conversions/))

**Gmail Ads Repositioned to Bottom of Promotions/Social Tabs**
Gmail ads on desktop have moved to the bottom of Promotions and Social tabs rather than appearing inline with messages. Monitor impression and CTR trends for any clients running Gmail/Discovery placements. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/gmail-ads-move-bottom-promotions-social-tabs/))

**Google Tracking: 5 Things That Matter in 2026**
PPC Hero published a timely audit checklist — Smart Bidding, audience targeting, and value-based optimisation all depend entirely on accurate conversion data. Worth using as a QA framework on any account audit. ([PPC Hero](https://ppchero.com/google-ads-tracking-in-2026-the-5-things-every-advertiser-needs-to-get-right/))

**4 New Google Shopping Feed Attributes**
Post-GML, Google has flagged four new Shopping feed attributes as must-implement for maximum visibility. AI adoption for Shopping is becoming near non-negotiable for paid visibility. If any clients run Shopping/PMax with feeds, these should be reviewed. ([PPC Hero](https://ppchero.com/4-new-must-use-google-shopping-feed-attributes-for-maximum-visibility/))

**June 2026 Spam Update Rolling Out**
Google's second spam update of the year is live and rolling out globally. Primarily an organic/SEO signal, but worth noting for any clients where organic performance influences paid strategy decisions or landing page quality. ([Search Engine Land](https://searchengineland.com/google-releases-june-2026-spam-update-481002) · [Search Engine Journal](https://www.searchenginejournal.com/google-begins-rolling-out-the-june-2026-spam-update/580424/))

---

## Meta & Social Ads Changes

**Meta Campaign Structure in the Andromeda Era**
PPC Hero's most practically useful Meta piece this week. The core argument: Meta's AI (Andromeda) is now better at finding the right people than manual audience segmentation. The implication is structural — fewer campaigns, broader targeting, letting the algorithm consolidate signal rather than fragmenting it across micro-audiences. This directly challenges how many agencies (including potentially us) still build Meta accounts. Read and discuss as a team before applying. ([PPC Hero](https://ppchero.com/meta-campaign-structure-in-andromeda-era/))

**Microsoft Advertising Product Disclaimer Updates**
Microsoft Advertising has updated product disclaimer functionality so retailers can display required disclaimers without compromising high-performing ad copy. Low priority unless we have retail clients on Microsoft — but worth flagging for compliance. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/microsoft-advertising-updates-product-disclaimers/))

---

## AI & Search Landscape

**ChatGPT CPC Ads: Live, Improving, and Worth Testing Now**
Two concurrent data points make this the most commercially urgent emerging channel item this week. First: SimilarWeb data shows ChatGPT-referred visitors view 12 pages and spend 11.8 minutes on-site vs. 6.5 pages / 5.6 minutes for standard referral traffic — materially better quality. Second: OpenAI reports ad dismissal rates have dropped 50%, signalling the conversational ad format is landing with users. CPC campaigns are now live for certain advertisers via OpenAI's Ad Manager. The r/PPC community has 3-week practitioner data starting to emerge — early reporters describe setup as straightforward but the platform still in learning phase. ([Search Engine Land](https://searchengineland.com/chatgpt-recommendations-brand-website-visits-study-480989) · [Search Engine Land](https://searchengineland.com/openai-says-chatgpt-ad-dismissals-have-dropped-50-as-relevance-improves-480991) · [Marketing O'Clock EP. 430](https://www.youtube.com/watch?v=1AMrfJF5xz8) · [Reddit r/PPC](https://old.reddit.com/r/PPC/comments/1ueoci2/thoughts_on_chatgpt_ads_3_weeks_in/))

**GML 2026: Gemini Is the Platform Narrative Now**
Google's official GML messaging is explicit — Gemini is the engine behind PMax, Shopping, and Search. The framing is that AI has moved from assistive to central. Advertiser role is now asset provision, signal quality, and guardrail-setting rather than bid and audience management. This is the platform's stated direction; our internal processes need to reflect it. ([YouTube](https://www.youtube.com/watch?v=EtGd3DpI5uA) · [YouTube](https://www.youtube.com/watch?v=Z7dY8uRfkGo))

**B2B Brands Rank in Google But Appear in Only 3% of AI Overviews**
AI Overviews appear in roughly half of relevant B2B searches, yet most ranking brands are absent from those answers. Not directly a paid play, but relevant for any B2B clients asking about AI search visibility — organic ranking no longer guarantees AI visibility. ([Search Engine Land](https://searchengineland.com/b2b-brands-rank-google-appear-ai-overviews-480954))

**LLM Rankings Are a New Discovery Surface**
GrowthHackers has two pieces on how LLMs are reshaping product and brand discovery — particularly relevant for clients in considered-purchase categories where ChatGPT and Perplexity are increasingly the first touchpoint before any search or ad interaction. Background reading rather than immediate action. ([GrowthHackers](https://growthhackers.com/growth-hacking/llm-rankings-the-new-battleground/?utm_source=rss&utm_medium=rss&utm_campaign=llm-rankings-the-new-battleground) · [GrowthHackers](https://growthhackers.com/growth-hacking/llm-rankings-all-you-need-to-know/?utm_source=rss&utm_medium=rss&utm_campaign=llm-rankings-all-you-need-to-know))

**AI Agent Accessibility: Your Site's New Visibility Problem**
AI agents read websites via the accessibility tree — and most sites have broken or incomplete accessibility markup. This is how AI crawlers, deep research agents, and voice interfaces parse your clients' pages. If the accessibility tree is broken, the AI can't read the site. Increasingly relevant as agentic commerce becomes real. ([Search Engine Journal](https://www.searchenginejournal.com/the-accessibility-tree-is-how-ai-agents-read-your-site-its-breaking/578171/))

**Deep Research AI Agents Can Be Manipulated via UGC**
A 13-word edit to a manipulated page caused fake entities to appear in 38–51% of AI deep research reports, rising to 62% with multiple pages. The implication for clients: brand mentions in UGC, forums, and review sites are now influencing what AI agents report about them — not just SEO rankings. ([Search Engine Land](https://searchengineland.com/deep-research-ai-agents-poison-ugc-480952))

**Marketing Hiring at Big Tech Down 36%**
SignalFire data shows marketing roles at major tech companies have fallen far more sharply than engineering. Contextually useful — reinforces the structural pressure on in-house marketing teams, which creates agency opportunity. ([Search Engine Journal](https://www.searchenginejournal.com/marketing-hiring-down-36-at-big-tech-data-shows/580485/))

---

## Tools & Resources

**Microsoft Clarity Now Flags Bots That Ignore robots.txt**
Clarity's Bot Analytics dashboard now detects when bots request disallowed URLs, with trend data and filters by bot type and operator. Useful for identifying scraper/AI crawler activity on client sites — particularly relevant given the AI agent visibility discussion above. ([Search Engine Journal](https://www.searchenginejournal.com/microsoft-clarity-now-flags-bots-that-ignore-robots-txt/580446/))

**MCP Is Not a Client Reporting System**
PPC Hero's piece is a useful reality check on the current MCP/AI reporting hype: connecting an MCP to a platform makes ad-hoc queries easier but does not produce client-ready reporting. Relevant if anyone is evaluating GoMarble or similar tools as a reporting replacement. Don't let the tool dictate the standard. ([PPC Hero](https://ppchero.com/mcp-is-not-your-client-reporting-system/))

**Claude + Granola for Meeting Efficiency**
Ruben Hassid posted a practical workflow: Granola (free) transcribes meetings silently, Claude Desktop connects via Connector to pull the last 3 transcripts, and a single prompt produces a pre-read document, a trimmed agenda, and per-person pre-work — cutting recurring meetings from 60 to 30 minutes. Genuinely useful for our weekly team syncs and client WIPs. (via LinkedIn — [Ruben Hassid](https://www.linkedin.com/in/rubenhassid/recent-activity/all/))

**SaaS Free-to-Paid Conversion Tracking Problem**
A r/PPC thread this week raised the specific problem of tracking ad-acquired free users who convert to paid over a 2–3 month window — relevant if we have or pitch SaaS clients with freemium models. The thread will surface community solutions worth reviewing. ([Reddit r/PPC](https://old.reddit.com/r/PPC/comments/1ueol5v/how_to_track_free_users_who_i_acquire_through_ads/))

---

## Takes Worth Noting

**"The AI optimises toward whatever signal you give it — your job is ensuring those signals are correct."**
This is the cleanest articulation of the agency value proposition in an automation-heavy platform environment, surfaced across multiple PPC Town Hall episodes this week. Jyll Saskin Gales (PMax/AI Max/Audiences), Amy Hebdon (control vs. automation), and the 20-year retrospective all converge on the same point: the agency role hasn't disappeared, it's shifted from execution to signal governance. The risk is clients hearing the "AI does everything" narrative from Google and concluding they don't need us. The counter is a documented process that shows what we're governing and why it matters. ([PPC Town Hall 119](https://www.youtube.com/watch?v=GlYNLrVjz-w) · [PPC Town Hall 118](https://www.youtube.com/watch?v=pd3_0RNn0Ng) · [PPC Town Hall 117](https://www.youtube.com/watch?v=97H74PpxrIE))

**"Stop trying to replace people with AI" — augmentation beats fear-based positioning**
Search Engine Land published a direct counterpoint to the "AI replaces marketers" narrative. The argument: fear-based AI positioning grabs attention but erodes client trust long-term. Augmentation framing — AI makes our team faster and more precise — is both more accurate and more durable as a client communication strategy. Relevant to how we talk about AI in pitches and QBRs. ([Search Engine Land](https://searchengineland.com/stop-replacing-people-with-ai-480865))

**Meta B2B: Google Ads vs. Meta Ads debate is live on r/PPC**
A thread this week revisits the perennial question for B2B SaaS. Worth monitoring for community data points on what's actually working in 2026 — particularly as AI targeting on Meta improves and intent signals on Google become harder to isolate. ([Reddit r/PPC](https://old.reddit.com/r/PPC/comments/1ue9exo/meta_ads_for_b2b_software_saas_vs_google_ads/))

**OpenAI Ads: Practitioner Conversion Data Starting to Emerge**
The r/PPC thread on "actual event conversions from OpenAI Ads" reflects where the community is — early access, learning phase, curiosity without hard data yet. Worth tracking week-on-week as more practitioners get access. ([Reddit r/PPC](https://old.reddit.com/r/PPC/comments/1ue3qxs/anyone_seeing_actual_event_conversions_from_openai_ads/))

---

## Agency Implications — Digital Goliath

### Do This Week

1. **Audit all accounts for Smart Campaign remnants.** Identify any API-based scripts or third-party tools that create or modify Smart Campaigns. Flag owners and build migration plans to PMax before Google hard-deprecates. ([Search Engine Land](https://searchengineland.com/google-ads-api-to-stop-supporting-new-smart-campaign-creation-480999))

2. **Apply for ChatGPT CPC beta access immediately if not already done.** Early access = early case studies. Also build a GA4 tracking template that captures ChatGPT as a distinct source/medium so we can validate the engagement quality data (12 pages / 11.8 min) against our own clients' traffic. ([Search Engine Land](https://searchengineland.com/chatgpt-recommendations-brand-website-visits-study-480989) · [Marketing O'Clock EP. 430](https://www.youtube.com/watch?v=1AMrfJF5xz8))

3. **Review all accounts with aggressive RSA pinning strategies.** Cross-reference against the updated Google guidance — pinning identical or very similar text now explicitly flagged as an Ad Strength risk. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/google-ads-tips-pinning-headlines-descriptions/))

4. **Check S2S conversion clients for volume shifts.** Google's improved S2S measurement (joining server-side data with browser signals when GCLID is present) may have changed reported conversion counts. Validate before the next client report cycle. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/improved-measurement-server-to-server-conversions/))

5. **Establish an AI Max testing protocol for Search.** AI Max is now live — before recommending it to any client, define the baseline measurement approach so we can isolate its impact. This should be formalised as a standard doc, not an ad-hoc decision per AM. ([PPC Hero](https://ppchero.com/google-ai-max-what-it-is-what-it-does-and-whether-your-account-is-actually-ready/))

6. **Check Gmail/Discovery placement performance data.** Gmail ads have moved to the bottom of Promotions/Social tabs on desktop. Pull impression and CTR trends for affected clients — if performance has shifted, flag before clients notice independently. ([PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-06/gmail-ads-move-bottom-promotions-social-tabs/))

7. **Add branded search trend vs. social spend overlay to monthly reporting.** Implement the cross-channel measurement approach from SEL — even a simple branded search volume correlation tied to Meta flight dates starts building the attribution story that protects Meta budgets. ([Search Engine Land](https://searchengineland.com/measure-paid-social-impact-paid-search-performance-480936))

8. **Formalise our PMax levers doc.** Define internally which controls we always apply (brand exclusions, audience signals, asset group architecture, account-level negative keyword lists) vs. which we test contextually (Search Themes, Final URL expansion). Every AM should be consistent. ([PPC Town Hall 119](https://www.youtube.com/watch?v=GlYNLrVjz-w))

### Client Retention Hooks

- **PMax clients:** Proactively brief them on what new Gemini-driven features are live vs. still rolling out. They shouldn't hear this from a competitor agency first. Use GML content as the hook. ([YouTube](https://www.youtube.com/watch?v=EtGd3DpI5uA) · [YouTube](https://www.youtube.com/watch?v=Z7dY8uRfkGo))

- **PMax-resistant clients:** Don't wait for them to raise it. Frame the Smart Campaign sunset directly: "The platform has made the decision — here's how we protect you within that reality." This is a proactive conversation, not a reactive one. ([Search Engine Land](https://searchengineland.com/google-ads-api-to-stop-supporting-new-smart-campaign-creation-480999))

- **Any client asking "do we still need an agency if Google's AI does everything?":** Deploy the signal governance narrative — the AI optimises toward whatever signal you give it; our job is making sure those signals are correct, the conversion data is clean, and the guardrails are set. Backed by our documented PMax process. ([PPC Town Hall 118](https://www.youtube.com/watch?v=pd3_0RNn0Ng))

- **Clients considering cutting Meta spend:** Use the cross-channel measurement methodology to show how Meta spend drives branded search volume. If we can demonstrate a measurable lift in branded search conversions during Meta flights, we've protected the budget with data rather than argument. ([Search Engine Land](https://searchengineland.com/measure-paid-social-impact-paid-search-performance-480936))

- **Any client asking "what are you doing beyond Google and Meta?":** ChatGPT CPC testing is now a concrete, specific answer. Share the engagement benchmarks (12 pages / 11.8 min vs. 6.5 / 5.6) and our active testing status. Proof of proactivity, not just a strategy slide. ([Search Engine Land](https://searchengineland.com/chatgpt-recommendations-brand-website-visits-study-480989))

### New Business Angles

- **The Smart Campaign deprecation hook for in-house teams and smaller agencies:** "Your current setup is being deprecated — here's the migration blueprint we've already built for clients in your category." Technically specific, immediately credible, creates urgency without manufactured pressure. ([Search Engine Land](https://searchengineland.com/google-ads-api-to-stop-supporting-new-smart-campaign-creation-480999))

- **"How Digital Goliath controls the uncontrollable in PMax" one-pager:** Build this now. Specifics: asset group logic, audience signal layering, conversion action architecture, brand exclusion methodology, account-level negative lists. Use in pitches against generalist agencies and in-house teams who just say "we use PMax too." ([PPC Town Hall 119](https://www.youtube.com/watch?v=GlYNLrVjz-w) · [PPC Town Hall 118](https://www.youtube.com/watch?v=pd3_0RNn0Ng))

- **ChatGPT ads as a competitive differentiator in pitch conversations:** Marketing leadership at every prospect is discussing this right now. Walking in with actual engagement benchmarks and an active testing framework (not a slide deck about "exploring it") positions us ahead of agencies still in watch-and-wait mode. ([Search Engine Land](https://searchengineland.com/chatgpt-recommendations-brand-website-visits-study-480989) · [Search Engine Land](https://searchengineland.com/openai-says-chatgpt-ad-dismissals-have-dropped-50-as-relevance-improves-480991))

- **Marketing hiring down 36% at big tech = in-house team pressure = agency opportunity.** Prospects with shrinking internal teams are structurally more open to outsourcing to a specialist agency. Use this as contextual framing in outreach to tech-sector prospects. ([Search Engine Journal](https://www.searchenginejournal.com/marketing-hiring-down-36-at-big-tech-data-shows/580485/))

---

## Cypress North Highlights

*No Cypress North episodes were included in this week's source material.*

---

## Must-Reads

1. **[How to measure paid social's impact on paid search performance](https://searchengineland.com/measure-paid-social-impact-paid-search-performance-480936)** ([Search Engine Land](https://searchengineland.com/measure-paid-social-impact-paid-search-performance-480936)) — The methodology piece every account manager needs before the next client who wants to cut Meta spend. Covers incrementality testing, geo holdouts, and branded search correlation.

2. **[Meta Campaign Structure in the Andromeda Era](https://ppchero.com/meta-campaign-structure-in-andromeda-era/)** ([PPC Hero](https://ppchero.com/meta-campaign-structure-in-andromeda-era/)) — Direct challenge to how most agencies still build Meta accounts. If Meta's AI is better at audience finding than we are, the structural implications are significant.

3. **[Google Ads Tracking in 2026: The 5 Things Every Advertiser Needs to Get Right](https://ppchero.com/google-ads-tracking-in-2026-the-5-things-every-advertiser-needs-to-get-right/)** ([PPC Hero](https://ppchero.com/google-ads-tracking-in-2026-the-5-things-every-advertiser-needs-to-get-right/)) — Use this as an audit checklist on every account. Everything downstream of tracking — Smart Bidding, audiences, value-based optimisation — breaks if this isn't right.

4. **[OpenAI says ChatGPT ad dismissals have dropped 50%](https://searchengineland.com/openai-says-chatgpt-ad-dismissals-have-dropped-50-as-relevance-improves-480991)** ([Search Engine Land](https://searchengineland.com/openai-says-chatgpt-ad-dismissals-have-dropped-50-as-relevance-improves-480991)) — Short read, high signal. The trajectory of this format is moving fast. Pair with the SimilarWeb engagement data piece for the full picture.

---

*Sources: 1 PPC Pulse daily brief(s) · 0 Cypress North episode(s)*