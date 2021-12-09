import React, { useState, useEffect } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockReposJohn';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({
    show: false,
    msg: '',
  });

  const searchGithubUser = async (user) => {
    setLoading(true);
    toggleError();
    try {
      const response = await axios(`${rootUrl}/users/${user}`);
      setGithubUser(response.data);

      const { login, followers_url } = response.data;

      // const reposResponse = await axios(
      //   `${rootUrl}/users/${login}/repos?per_page=100`
      // );
      // setRepos(reposResponse.data);

      // const followersResponse = await axios(`${followers_url}?per_page=100`);
      // setFollowers(followersResponse.data);

      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        const [repos, followers] = results;
        const status = 'fulfilled';
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } catch (error) {
      console.log(error);
      toggleError(true, 'there is no user with that username');
    }
    checkRequest();
    setLoading(false);
  };

  const checkRequest = async () => {
    try {
      const { data } = await axios(`${rootUrl}/rate_limit`);
      const {
        rate: { remaining },
      } = data;
      setRequests(remaining);
      if (remaining === 0) {
        toggleError(true, 'sorry you have exceeded your hourly rate limit!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const toggleError = (show = false, msg = '') => {
    setError({ show, msg });
  };

  useEffect(() => {
    checkRequest();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        loading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
