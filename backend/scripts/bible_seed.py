"""Master biblical timeline: event_range on bar, written_range for marker (BC = negative).

Each row: title, era, author, event_start_year, event_end_year, written_start_year, written_end_year, color, icon
"""

BIBLE_BOOKS: list[tuple[str, str, str, int, int, int, int, str, str]] = [
    # Primeval & Patriarch
    ("Genesis", "Primeval & Patriarch Era", "Moses", -4000, -1800, -1440, -1400, "#5b7c99", "📜"),
    ("Job", "Primeval & Patriarch Era", "Unknown", -2000, -1800, -1500, -1400, "#c9a84c", "📜"),
    # Exodus & Wilderness
    ("Exodus", "Exodus & Wilderness", "Moses", -1446, -1406, -1440, -1400, "#5b7c99", "📜"),
    ("Leviticus", "Exodus & Wilderness", "Moses", -1445, -1445, -1440, -1400, "#5b7c99", "📜"),
    ("Numbers", "Exodus & Wilderness", "Moses", -1445, -1406, -1440, -1400, "#5b7c99", "📜"),
    ("Deuteronomy", "Exodus & Wilderness", "Moses", -1406, -1406, -1400, -1400, "#5b7c99", "📜"),
    # Conquest & Judges
    ("Joshua", "Conquest & Judges", "Joshua", -1400, -1370, -1370, -1370, "#6b8f71", "📜"),
    ("Judges", "Conquest & Judges", "Samuel", -1370, -1050, -1050, -1050, "#6b8f71", "📜"),
    ("Ruth", "Conquest & Judges", "Samuel", -1100, -1050, -1000, -1000, "#6b8f71", "📜"),
    # United Kingdom
    ("1 Samuel", "United Kingdom", "Samuel, Gad, Nathan", -1100, -1010, -930, -930, "#6b8f71", "📜"),
    ("2 Samuel", "United Kingdom", "Gad, Nathan", -1010, -970, -930, -930, "#6b8f71", "📜"),
    ("1 Chronicles", "United Kingdom", "Ezra", -1010, -970, -450, -450, "#6b8f71", "📜"),
    ("Psalms", "United Kingdom", "David and others", -1000, -400, -1000, -400, "#c9a84c", "📜"),
    ("Proverbs", "United Kingdom", "Solomon", -950, -930, -950, -950, "#c9a84c", "📜"),
    ("Ecclesiastes", "United Kingdom", "Solomon", -935, -935, -935, -935, "#c9a84c", "📜"),
    ("Song of Solomon", "United Kingdom", "Solomon", -965, -965, -965, -965, "#c9a84c", "📜"),
    # Divided Kingdom
    ("1 Kings", "Divided Kingdom", "Jeremiah", -970, -850, -560, -560, "#6b8f71", "📜"),
    ("2 Kings", "Divided Kingdom", "Jeremiah", -850, -586, -560, -560, "#6b8f71", "📜"),
    ("2 Chronicles", "Divided Kingdom", "Ezra", -970, -586, -450, -450, "#6b8f71", "📜"),
    ("Isaiah", "Divided Kingdom", "Isaiah", -740, -680, -700, -700, "#a67c52", "📜"),
    ("Hosea", "Divided Kingdom", "Hosea", -755, -715, -750, -750, "#8f7b6b", "📜"),
    ("Joel", "Divided Kingdom", "Joel", -835, -835, -835, -835, "#8f7b6b", "📜"),
    ("Amos", "Divided Kingdom", "Amos", -760, -750, -760, -760, "#8f7b6b", "📜"),
    ("Micah", "Divided Kingdom", "Micah", -735, -700, -730, -730, "#8f7b6b", "📜"),
    ("Jonah", "Divided Kingdom", "Jonah", -780, -750, -760, -760, "#8f7b6b", "📜"),
    ("Nahum", "Divided Kingdom", "Nahum", -650, -650, -650, -650, "#8f7b6b", "📜"),
    ("Zephaniah", "Divided Kingdom", "Zephaniah", -640, -620, -630, -630, "#8f7b6b", "📜"),
    ("Habakkuk", "Divided Kingdom", "Habakkuk", -609, -605, -609, -609, "#8f7b6b", "📜"),
    ("Jeremiah", "Divided Kingdom", "Jeremiah", -626, -586, -600, -600, "#a67c52", "📜"),
    ("Lamentations", "Divided Kingdom", "Jeremiah", -586, -586, -586, -586, "#a67c52", "📜"),
    ("Obadiah", "Divided Kingdom", "Obadiah", -586, -586, -586, -586, "#8f7b6b", "📜"),
    # Exile
    ("Ezekiel", "Exile (Babylon)", "Ezekiel", -593, -571, -580, -580, "#a67c52", "📜"),
    ("Daniel", "Exile (Babylon)", "Daniel", -605, -530, -530, -530, "#a67c52", "📜"),
    # Return & Restoration
    ("Ezra", "Return & Restoration", "Ezra", -538, -458, -450, -450, "#6b8f71", "📜"),
    ("Nehemiah", "Return & Restoration", "Nehemiah", -445, -430, -430, -430, "#6b8f71", "📜"),
    ("Esther", "Return & Restoration", "Unknown", -483, -473, -450, -450, "#6b8f71", "📜"),
    ("Haggai", "Return & Restoration", "Haggai", -520, -520, -520, -520, "#8f7b6b", "📜"),
    ("Zechariah", "Return & Restoration", "Zechariah", -520, -480, -500, -500, "#8f7b6b", "📜"),
    ("Malachi", "Return & Restoration", "Malachi", -430, -430, -430, -430, "#8f7b6b", "📜"),
    # NT — Life of Christ (event) vs composition (written)
    ("Matthew", "Life of Christ", "Matthew", -4, 30, 60, 70, "#9a8b6b", "📜"),
    ("Mark", "Life of Christ", "Mark", -4, 30, 55, 65, "#9a8b6b", "📜"),
    ("Luke", "Life of Christ", "Luke", -4, 30, 60, 70, "#9a8b6b", "📜"),
    ("John", "Life of Christ", "John", -4, 30, 85, 95, "#9a8b6b", "📜"),
    ("Acts", "Early Church", "Luke", 30, 62, 62, 70, "#6b8f71", "📜"),
    ("James", "Early Church", "James", 30, 62, 45, 50, "#7a6b99", "📜"),
    ("Galatians", "Early Church", "Paul", 48, 55, 48, 55, "#7a6b99", "📜"),
    ("1 Thessalonians", "Early Church", "Paul", 50, 51, 50, 51, "#7a6b99", "📜"),
    ("2 Thessalonians", "Early Church", "Paul", 50, 51, 50, 51, "#7a6b99", "📜"),
    ("1 Corinthians", "Early Church", "Paul", 55, 56, 55, 56, "#7a6b99", "📜"),
    ("2 Corinthians", "Early Church", "Paul", 55, 56, 55, 56, "#7a6b99", "📜"),
    ("Romans", "Early Church", "Paul", 55, 57, 57, 57, "#7a6b99", "📜"),
    ("Ephesians", "Paul’s Later Ministry", "Paul", 60, 67, 60, 62, "#7a6b99", "📜"),
    ("Philippians", "Paul’s Later Ministry", "Paul", 60, 67, 60, 62, "#7a6b99", "📜"),
    ("Colossians", "Paul’s Later Ministry", "Paul", 60, 67, 60, 62, "#7a6b99", "📜"),
    ("Philemon", "Paul’s Later Ministry", "Paul", 60, 67, 60, 62, "#7a6b99", "📜"),
    ("1 Timothy", "Paul’s Later Ministry", "Paul", 63, 67, 63, 65, "#7a6b99", "📜"),
    ("Titus", "Paul’s Later Ministry", "Paul", 63, 67, 63, 63, "#7a6b99", "📜"),
    ("2 Timothy", "Paul’s Later Ministry", "Paul", 66, 67, 66, 67, "#7a6b99", "📜"),
    ("1 Peter", "Paul’s Later Ministry", "Peter", 62, 67, 62, 64, "#7a6b99", "📜"),
    ("2 Peter", "Paul’s Later Ministry", "Peter", 64, 67, 64, 67, "#7a6b99", "📜"),
    ("Hebrews", "Paul’s Later Ministry", "Unknown", 60, 70, 60, 70, "#7a6b99", "📜"),
    ("Jude", "Paul’s Later Ministry", "Jude", 65, 80, 65, 80, "#7a6b99", "📜"),
    ("1 John", "Final Writings", "John", 85, 95, 85, 95, "#7a6b99", "📜"),
    ("2 John", "Final Writings", "John", 85, 95, 85, 95, "#7a6b99", "📜"),
    ("3 John", "Final Writings", "John", 85, 95, 85, 95, "#7a6b99", "📜"),
    ("Revelation", "Final Writings", "John", 90, 95, 95, 95, "#b85c5c", "📜"),
]

EMPIRES: list[tuple[str, str, int, int, str, str]] = [
    ("Babylonian Empire", "empire", -626, -539, "#8b5a3c", "🏛️"),
    ("Persian Empire", "empire", -550, -330, "#4a6670", "🏛️"),
    ("Greek (Hellenistic) Empire", "empire", -336, -146, "#a67c3d", "⚔️"),
    ("Roman Empire", "empire", -27, 476, "#7a3d3d", "🏛️"),
]

DEFAULT_THEMES: list[tuple[str, str | None, str | None]] = [
    ("faith", "#6b8f71", "Trust and belief in God"),
    ("fear", "#94a3b8", "Anxiety, awe, or fear of the Lord"),
    ("obedience", "#c9a84c", "Following God's commands"),
    ("pride", "#b85c5c", "Self-reliance and humility struggles"),
    ("discipline", "#5b7c99", "Habits, spiritual disciplines"),
    ("gratitude", "#c9a84c", "Thanksgiving and joy"),
    ("hope", "#6b8f71", "Expectation of God's promises"),
]
