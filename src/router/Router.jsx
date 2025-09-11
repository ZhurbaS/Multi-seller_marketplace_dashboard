import React, { Suspense } from "react";
import { useRoutes } from "react-router-dom";

const Router = ({ allRoutes }) => {
  const routes = useRoutes([...allRoutes]);
  return <Suspense fallback={<div>Loading page...</div>}>{routes}</Suspense>;
};

export default Router;
