import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CodeforcesStat.css'; // Import your CSS file for styles

const UserTagSolveCounts = () => {
  const [handle, setHandle] = useState('');
  const [handle_2, setHandle_2] = useState('Tspectre');
  const [tagCounts, setTagCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagProblems, setTagProblems] = useState([]);
  const [sortByTag, setSortByTag] = useState('name'); // Default sort by tag name
  const [sortOrder, setSortOrder] = useState('asc'); // Default sort order for tags
  const [sortByProblems, setSortByProblems] = useState('asc'); // Default sort order for problems
  const [ignite312AcceptedProblemIds, setIgnite312AcceptedProblemIds] = useState(new Set());
  const [refreshClicked, setRefreshClicked] = useState(true); // State to track the "Refresh" button click

  useEffect(() => {
    if (refreshClicked) {
      fetchDataForYou();
    }
  }, [refreshClicked]); // Fetch Ignite312 data only when refreshClicked state changes

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = 'OK';
      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle}&result=${result}`);
      const submissions = response.data.result;

      const uniqueProblems = new Set();
      const newTagCounts = {};

      submissions.forEach((submission) => {
        const problemId = submission.problem?.contestId + submission.problem?.index;

        if (!uniqueProblems.has(problemId) && submission.verdict === result) {
          uniqueProblems.add(problemId);

          const tags = submission.problem?.tags || [];
          const uniqueTags = Array.from(new Set(tags)); // Ensure unique tags

          uniqueTags.forEach((tag) => {
            newTagCounts[tag] = (newTagCounts[tag] || new Set()).add({
              id: problemId,
              name: submission.problem.name,
              rating: submission.problem.rating,
              link: `https://codeforces.com/problemset/problem/${submission.problem.contestId}/${submission.problem.index}`
            });
          });
        }
      });

      setTagCounts(newTagCounts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataForYou = async () => {
    try {
      const result = 'OK';
      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${handle_2}&result=${result}`);
      const submissions = response.data.result;

      // Check if submissions is defined before iterating over it
      if (submissions) {
        const acceptedProblemIds = new Set();
        const submittedProblemIds = new Set();

        submissions.forEach((submission) => {
          const problemId = submission.problem?.contestId + submission.problem?.index;

          if (submission.verdict === result) {
            acceptedProblemIds.add(problemId);
          }

          submittedProblemIds.add(problemId);
        });

        setIgnite312AcceptedProblemIds(acceptedProblemIds);

        // Update the tagProblems array with the submitted flag
        const updatedTagProblems = tagProblems.map(problem => ({
          ...problem,
          submitted: submittedProblemIds.has(problem.id),
        }));

        setTagProblems(updatedTagProblems);
        setRefreshClicked(false); // Reset the state after fetching data
      } else {
        // Handle the case when submissions is undefined or null
        console.error('Error: Submissions data is undefined or null.');
      }
    } catch (error) {
      console.error('Error fetching Ignite312 data:', error);
    }
  };


  const handleTagClick = (tag) => {
    setSelectedTag(tag);

    // Get all problems associated with the selected tag
    const problems = Array.from(tagCounts[tag] || []);
    setTagProblems(problems);
  };

  const handleSortChange = (event) => {
    const selectedSortBy = event.target.value;
    setSortOrder(selectedSortBy);

    // Apply sorting for tag list
    const sortedTagList = sortTagList(Object.entries(tagCounts));
    setTagCounts(sortedTagList);

    // Apply sorting for the right column problems list
    const sortedProblems = sortProblemsList(tagProblems, selectedSortBy);
    setTagProblems(sortedProblems);
  };

  const sortTagList = (tagList) => {
    switch (sortByTag) {
      case 'name':
        return tagList.sort((a, b) => a[0].localeCompare(b[0]));
      case 'countAsc':
        return tagList.sort((a, b) => a[1].size - b[1].size);
      case 'countDesc':
        return tagList.sort((a, b) => b[1].size - a[1].size);
      default:
        return tagList;
    }
  };

  const sortProblemsList = (problemsList, order) => {
    return problemsList.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;

      if (order === 'asc') {
        return ratingA - ratingB;
      } else {
        return ratingB - ratingA;
      }
    }).map(problem => {
      // Check if the problem is solved by "ignite312"
      const youSolved = ignite312AcceptedProblemIds.has(problem.id);

      return {
        ...problem,
        youSolved,
      };
    });
  };

  const handleRefresh = () => {
    // Set the refreshClicked state to trigger the useEffect hook
    setRefreshClicked(true);
  };

  return (
    <div className="user-tag-solve-counts">
      <div className="left-column">
        <h2>User Tag Solve Counts </h2>
        <div className="input-section">
          <label>
            Codeforces Handle:<span>&nbsp;&nbsp;</span>
            <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} />
          </label>
          <div className="button-container">
            <button onClick={fetchData} disabled={!handle || loading}>
              Fetch Data
            </button>
          </div>
          <label>
            Sort By Tag:<span>&nbsp;&nbsp;</span>
            <select value={sortByTag} onChange={(e) => setSortByTag(e.target.value)}>
              <option value="name">Name</option>
              <option value="countAsc">Count Asc</option>
              <option value="countDesc">Count Desc</option>
            </select>
          </label>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="tag-list">
            {sortTagList(Object.entries(tagCounts)).map(([tag, solveCount]) => (
              <li key={tag}>
                <button className="tag-button" onClick={() => handleTagClick(tag)}>
                  {tag}: {solveCount.size}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="right-column">
        {selectedTag && (
          <div>
            <h2>Problems associated with {selectedTag}</h2>
            <label>
              Your Codeforces Handle:<span>&nbsp;&nbsp;</span>
              <input type="text" value={handle_2} onChange={(e) => setHandle_2(e.target.value)} />
            </label>
            <div className="button-container">
              <button onClick={handleRefresh} disabled={!handle}>
                Refresh
              </button>
              {refreshClicked && <p>Refreshing...</p>}
            </div>
            <div className="sort-container">
              <label>
                Sort By:<span>&nbsp;&nbsp;</span>
                <select value={sortByProblems} onChange={(e) => setSortByProblems(e.target.value)}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </label>
            </div>

            <div className="card-list">
              {sortProblemsList(tagProblems, sortByProblems).map((problem, index) => (
                <div
                  className={`${problem.youSolved ? 'solved' : (problem.submitted ? 'notsolved-red' : 'notsolved')}`}
                  key={index}
                >
                  <a href={problem.link} target="_blank" rel="noopener noreferrer">
                    <span className="index">{index + 1}.</span>
                    <span>&nbsp;</span>
                    <span className="problem-info">
                      <span className="problem-name">{problem.name}</span>
                      {problem.rating && <span>({problem.rating})</span>}
                    </span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTagSolveCounts;
