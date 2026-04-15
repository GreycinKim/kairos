from app.schemas.jbch_hub import JbchLink, JbchPageSlice, JbchRecitationCard

OT_BOOKS = [
    "Genesis",
    "Exodus",
    "Leviticus",
    "Numbers",
    "Deuteronomy",
    "Joshua",
    "Judges",
    "Ruth",
    "1 Samuel",
    "2 Samuel",
    "1 Kings",
    "2 Kings",
    "1 Chronicles",
    "2 Chronicles",
    "Ezra",
    "Nehemiah",
    "Esther",
    "Job",
    "Psalms",
    "Proverbs",
    "Ecclesiastes",
    "Song of Solomon",
    "Isaiah",
    "Jeremiah",
    "Lamentations",
    "Ezekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obadiah",
    "Jonah",
    "Micah",
    "Nahum",
    "Habakkuk",
    "Zephaniah",
    "Haggai",
    "Zechariah",
    "Malachi",
]

NT_BOOKS = [
    "Matthew",
    "Mark",
    "Luke",
    "John",
    "Acts",
    "Romans",
    "1 Corinthians",
    "2 Corinthians",
    "Galatians",
    "Ephesians",
    "Philippians",
    "Colossians",
    "1 Thessalonians",
    "2 Thessalonians",
    "1 Timothy",
    "2 Timothy",
    "Titus",
    "Philemon",
    "Hebrews",
    "James",
    "1 Peter",
    "2 Peter",
    "1 John",
    "2 John",
    "3 John",
    "Jude",
    "Revelation",
]

READER_SOURCE = "kairos://reader"


def default_index_links() -> list[JbchLink]:
    """Canonical English book names (in-app reader only)."""
    links: list[JbchLink] = []
    for name in OT_BOOKS + NT_BOOKS:
        links.append(JbchLink(text=name, href="#"))
    return links


def default_dictionary_blocks() -> list[str]:
    return [
        "ἀγάπη (agapē) — often translated “love”; self-giving commitment rather than mere affection.",
        "שָׁלוֹם (shalom) — peace, wholeness, right relationship between God, people, and creation.",
        "λόγος (logos) — word, message, rational order; in Johannine usage, the personal self-expression of God.",
        "חֶסֶד (chesed) — loyal love, covenant kindness, steadfast mercy.",
        "πίστις (pistis) — faithfulness and trust; reliance on God’s character and promises.",
    ]


def default_recitation_cards() -> list[JbchRecitationCard]:
    # WEB (World English Bible) is public domain.
    return [
        JbchRecitationCard(
            title="The Lord is my shepherd",
            reference="Psalm 23",
            text=(
                "Yahweh is my shepherd: I shall lack nothing. He makes me lie down in green pastures. "
                "He leads me beside still waters. He restores my soul. He guides me in the paths of righteousness "
                "for his name’s sake. Even though I walk through the valley of the shadow of death, I will fear no evil, "
                "for you are with me; your rod and your staff, they comfort me."
            ),
        ),
        JbchRecitationCard(
            title="For God so loved the world",
            reference="John 3:16",
            text=(
                "For God so loved the world, that he gave his one and only Son, that whoever believes in him "
                "should not perish, but have eternal life."
            ),
        ),
        JbchRecitationCard(
            title="The fruit of the Spirit",
            reference="Galatians 5:22–23",
            text=(
                "But the fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, "
                "gentleness, and self-control. Against such things there is no law."
            ),
        ),
    ]


def empty_page_slice(url: str) -> JbchPageSlice:
    return JbchPageSlice(source_url=url, requires_auth=False, links=[], text_blocks=[])


def default_hub_overlay() -> tuple[JbchPageSlice, JbchPageSlice, JbchPageSlice, list[JbchRecitationCard]]:
    index = JbchPageSlice(
        source_url=READER_SOURCE,
        requires_auth=False,
        links=default_index_links(),
        text_blocks=[
            "Built-in Protestant canon book list. Chapter text is loaded by the Kairos API when you open a passage."
        ],
    )
    dictionary = JbchPageSlice(
        source_url=READER_SOURCE,
        requires_auth=False,
        links=[],
        text_blocks=default_dictionary_blocks(),
    )
    rec_page = JbchPageSlice(
        source_url=READER_SOURCE,
        requires_auth=False,
        links=[],
        text_blocks=["Sample passages for memorization drills (in-app)."],
    )
    cards = default_recitation_cards()
    return index, dictionary, rec_page, cards
