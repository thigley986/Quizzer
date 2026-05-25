# Geography Question Bank

Static reviewed geography question bank for Quizzer. The bank contains 700 multiple-choice records, with 70 records for each supported age group: 9: 70, 10: 70, 11: 70, 12: 70, 13: 70, 14: 70, 15: 70, 16: 70, 17: 70, 18+: 70.

Question text and explanations are original. Each record includes source metadata and `reviewStatus: "reviewed"`. This bank is U.S.-geography focused: state and county comparison records were generated from the 2024 Census state and county Gazetteer files; region and division records use the Census Geography Program glossary; state high-point records use USGS educational elevation data.

## Files

- `questions.json`: static JSON array of geography questions.

## Source Set

- U.S. Census Bureau 2024 Gazetteer Files: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_state_national.zip
- U.S. Census Bureau 2024 Gazetteer Files: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip
- U.S. Census Bureau Geography Program Glossary: https://www.census.gov/programs-surveys/geography/about/glossary.html
- U.S. Geological Survey Highest and Lowest Elevations: https://www.usgs.gov/educational-resources/highest-and-lowest-elevations

## Schema

Each object has `id`, `ageGroup`, `category`, `difficulty`, `question`, `choices`, `correctAnswer`, `explanation`, `sourceName`, `sourceUrl`, and `reviewStatus`.
