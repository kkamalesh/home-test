import axios from 'axios';
import { MovieService } from '../services/movieService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MovieService', () => {
  const movieService = new MovieService();
  const mockMovies = [
    { id: 1, title: 'Movie A', release_date: '2023-01-01', vote_average: 8.5 },
    { id: 2, title: 'Movie B', release_date: '2023-05-15', vote_average: 7.2 }
  ];

  const mockEditors = [
    { known_for_department: 'Editing', name: 'Editor 1' },
    { known_for_department: 'Editing', name: 'Editor 2' }
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch movies by year and return enriched data', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { results: mockMovies } });
    mockedAxios.get.mockResolvedValueOnce({ data: { crew: mockEditors } });
    mockedAxios.get.mockResolvedValueOnce({ data: { crew: mockEditors } });

    const movies = await movieService.getMoviesByYear('2023');

    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/discover/movie'),
      expect.objectContaining({
        params: { primary_release_year: '2023' }
      })
    );

    expect(movies).toEqual([
      {
        title: 'Movie A',
        release_date: 'January 1, 2023',
        vote_average: 8.5,
        editors: ['Editor 1', 'Editor 2']
      },
      {
        title: 'Movie B',
        release_date: 'May 15, 2023',
        vote_average: 7.2,
        editors: ['Editor 1', 'Editor 2']
      }
    ]);
  });

  test('should handle errors when fetching movies', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    await expect(movieService.getMoviesByYear('2023')).rejects.toThrow('Failed to fetch movies');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  test('should handle errors when fetching movie editors', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { results: mockMovies } });
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error for credits'));

    const movies = await movieService.getMoviesByYear('2023');

    expect(movies).toEqual([
      {
        title: 'Movie A',
        release_date: 'January 1, 2023',
        vote_average: 8.5,
        editors: []
      },
      {
        title: 'Movie B',
        release_date: 'May 15, 2023',
        vote_average: 7.2,
        editors: []
      }
    ]);
  });
});