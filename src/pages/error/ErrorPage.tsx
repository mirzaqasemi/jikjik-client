import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  let errorMessage = "An unknown error occurred";
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div style={{ padding: '2rem', color: 'red' }}>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p><i>{errorMessage}</i></p>
    </div>
  );
}
