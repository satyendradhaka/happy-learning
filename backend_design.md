# Schema Structure

### Course

- Title
- Topics (array) [ref to a topic schema?]
- Videos (array of ref to it's videos)
- Details {...}

### Video

- Title
- filePath
- Course [ref : 'Course']
- Viewcount
- Details {...}

### User

- username
- email
- enrolled_courses (array of 'course')
  - course [ref :'Course']
    - completed_videos (an array of references to completed videos)
    - last_view [ref:'Video]
      - timestamp
    - Bookmarks (array of bookmark)
      - bookmark
        - video [ref:'Video']
        - timestamp
        - text {...}  

# Tentative Routes  

- /users
	- /all
	- /:id
- /courses
	- /all
  - /dashboard ?
	- /:id
    - /:videos/:id

	