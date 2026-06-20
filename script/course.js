// course.js — course list display and filtering

const courses = [
  { subject: 'CSE', number: 110, title: 'Introduction to Programming', credits: 2, certificate: 'Web and Computer Programming', description: 'This course will introduce students to programming. It will introduce the building blocks of programming languages (variables, decisions, calculations, loops, array, and input/output) and use them to solve problems.', technology: ['Python'], completed: true },
  { subject: 'WDD', number: 130, title: 'Web Fundamentals', credits: 2, certificate: 'Web and Computer Programming', description: 'This course introduces students to the World Wide Web and to careers in web site design and development. The course is hands on with students actually participating in simple web designs and programming. It is anticipated that students who complete this course will understand the fields of web design and development and will have a good idea if they want to pursue this field as a major or minor.', technology: ['HTML', 'CSS'], completed: true },
  { subject: 'CSE', number: 111, title: 'Programming with Functions', credits: 2, certificate: 'Web and Computer Programming', description: 'CSE 111 students become more organized, efficient, and powerful computer programmers by learning to research and call functions written by others; to write, call , debug, and test their own functions; and to handle errors within functions. CSE 111 students write programs with functions to solve problems in many disciplines, including business, physical science, human performance, and humanities.', technology: ['Python'], completed: true },
  { subject: 'CSE', number: 210, title: 'Programming with Classes', credits: 2, certificate: 'Web and Computer Programming', description: 'This course will introduce the notion of classes and objects. It will present encapsulation at a conceptual level. It will also work on algorithm development and an introduction to the concepts of complexity.', technology: ['C#'], completed: false },
  { subject: 'WDD', number: 131, title: 'Dynamic Web Fundamentals', credits: 2, certificate: 'Web and Computer Programming', description: 'This course builds on prior experience in Web Fundamentals and programming. Students will learn to create dynamic websites that use JavaScript to respond to events, update content, and create responsive user experiences.', technology: ['HTML', 'CSS', 'JavaScript'], completed: true },
  { subject: 'WDD', number: 231, title: 'Frontend Web Development I', credits: 2, certificate: 'Web and Computer Programming', description: 'This course builds on prior experience with Dynamic Web Fundamentals and programming. Students will focus on user experience, accessibility, compliance, performance optimization, and front-end programming frameworks.', technology: ['HTML', 'CSS', 'JavaScript'], completed: false },
];

const grid = document.getElementById('course-grid');
const creditsEl = document.getElementById('credits-total');
const filterbuttons = document.querySelectorAll('.filter-button');

function displayCourses(list) {
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(course => {
    const card = document.createElement('div');
    card.classList.add('course-card');
    card.setAttribute('role', 'listitem');
    if (course.completed) card.classList.add('completed');
    card.textContent = `${course.subject} ${course.number}`;
    card.setAttribute('title', course.title);
    grid.appendChild(card);
  });
  if (creditsEl) {
    const total = list.reduce((sum, c) => sum + c.credits, 0);
    creditsEl.textContent = `The total credits for courses listed above is ${total}`;
  }
}

function setActivebutton(button) {
  filterbuttons.forEach(b => b.classList.remove('active'));
  button.classList.add('active');
}

filterbuttons.forEach(button => {
  button.addEventListener('click', () => {
    setActivebutton(button);
    const filter = button.dataset.filter;
    if (filter === 'all') {
      displayCourses(courses);
    } else {
      displayCourses(courses.filter(c => c.subject === filter.toUpperCase()));
    }
  });
});

// Initial display — All
displayCourses(courses);
// Mark the "All" button active on load
const allbutton = document.querySelector('[data-filter="all"]');
if (allbutton) allbutton.classList.add('active');
