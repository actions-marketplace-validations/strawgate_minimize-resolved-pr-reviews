import {
  GraphQLClient,
  ReviewThread,
  PullRequestReviewNode,
} from "./types";

interface PullRequestDataResponse {
  repository: {
    pullRequest: {
      reviewThreads: {
        nodes: ReviewThread[];
      };
      reviews: {
        nodes: PullRequestReviewNode[];
      };
    };
  };
}

const PULL_REQUEST_DATA_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 1) {
              nodes {
                author {
                  login
                }
                pullRequestReview {
                  id
                  createdAt
                  isMinimized
                }
              }
            }
          }
        }
        reviews(first: 100) {
          nodes {
            id
            author {
              login
            }
            createdAt
            isMinimized
          }
        }
      }
    }
  }
`;

const MINIMIZE_MUTATION = `
  mutation($subjectId: ID!) {
    minimizeComment(input: { subjectId: $subjectId, classifier: RESOLVED }) {
      minimizedComment {
        isMinimized
      }
    }
  }
`;

/** Fetches all review threads and reviews for a PR in a single query. */
export async function fetchPullRequestData(
  client: GraphQLClient,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ threads: ReviewThread[]; reviews: PullRequestReviewNode[] }> {
  const response = await client.graphql<PullRequestDataResponse>(
    PULL_REQUEST_DATA_QUERY,
    { owner, repo, number: prNumber },
  );
  const pr = response.repository.pullRequest;
  return {
    threads: pr.reviewThreads.nodes,
    reviews: pr.reviews.nodes,
  };
}

/** Minimizes a review or comment by its node ID. */
export async function minimizeReview(
  client: GraphQLClient,
  subjectId: string,
): Promise<void> {
  await client.graphql(MINIMIZE_MUTATION, { subjectId });
}
