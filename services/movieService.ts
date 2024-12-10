import axios from 'axios';
import { Movie } from '../src/types';
import { config } from '../src/config';
  
  export class MovieService {
    private headers = {
      Authorization: `Bearer ${config.apiKey}`
    };
  
    async getMoviesByYear(year: string): Promise<Movie[]> {
      try {
        const movies = await this.fetchMoviesByYear(year);
        return await this.enrichMoviesWithEditors(movies);
      } catch (error) {
        console.error('Error fetching movies:', error);
        throw new Error('Failed to fetch movies');
      }
    }

    private async fetchMoviesByYear(year: string): Promise<any[]> {
      try {
        const response = await axios.get(
          `${config.baseUrl}/discover/movie`, {
          headers: this.headers,
          params: {
            language: 'en-US',
            page: 1,
            primary_release_year: year,
            sort_by: 'popularity.desc'
          }
        });
        return response.data.results;
      } catch (error) {
        console.error('Error fetching movies by year:', error);
        throw new Error('Failed to fetch movies by year');
      }
    }

    private async enrichMoviesWithEditors(movies: any[]): Promise<Movie[]> {
      return Promise.all(
        movies.map(async (movie) => {
          const editors = await this.getMovieEditors(movie.id).catch(() => []);
          return {
            title: movie.title,
            release_date: new Date(movie.release_date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            }),
            vote_average: movie.vote_average,
            editors
          };
        })
      );
    }

    private async getMovieEditors(movieId: number): Promise<string[]> {
      try {
        const response = await axios.get(
          `${config.baseUrl}/movie/${movieId}/credits`, {
          headers: this.headers
        });
        return response.data.crew
          .filter((person: any) => person.known_for_department === 'Editing')
          .map((editor: any) => editor.name);
      } catch (error) {
        console.error('Error fetching movie editors:', error);
        return [];
      }
    }
  }
