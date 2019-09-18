[![Build Status](https://defradev.visualstudio.com/DEFRA_FutureFarming/_apis/build/status/defra-ffc-demo-web?branchName=develop)](https://defradev.visualstudio.com/DEFRA_FutureFarming/_build/latest?definitionId=579&branchName=develop)
[![Known Vulnerabilities](https://snyk.io//test/github/DEFRA/ffc-demo-web/badge.svg?targetFile=package.json)](https://snyk.io//test/github/DEFRA/ffc-demo-web?targetFile=package.json)

# FFC Demo Service

Digital service mock to claim public money in the event property subsides into mine shaft.  This is the web front end for the application.  It contains a simple claim submission journey where user input data is cached in Redis.  On submission the data is pulled from Redis and passed to the API gateway.

# Prerequisites

Either:
- Docker
- Docker Compose

Or:
- Kubernetes
- Helm

Or:
- Node 10
- Redis

# Environment variables

The following environment variables are required by the application container. Values for development are set in the Docker Compose configuration. Default values for production-like deployments are set in the Helm chart and may be overridden by build and release pipelines.

| Name                                  | Description                | Required | Default               | Valid                       |
|---------------------------------------|----------------------------|:--------:|-----------------------|-----------------------------|
| NODE_ENV                              | Node environment           | no       | development           | development,test,production |
| PORT                                  | Port number                | no       | 3000                  |                             |
| CACHE_NAME               | Cache name                 | no       | redisCache            |                             |
| REDIS_HOSTNAME                        | Redis host                 | no       | localhost             |                             |
| REDIS_PORT                            | Redis port                 | no       | 6379                  |                             |
| COOKIE_PASSWORD                       | Redis cookie password      | yes      |                       |                             |
| API_GATEWAY              | Url of service API Gateway | no       | http://localhost:3001 |                             |
| SESSION_TIMEOUT_IN_MINUTES    | Redis session timeout | no       | 30                    |                             |
| REST_CLIENT_TIMEOUT_IN_MILLIS | Rest client timout    | no       | 5000                  |                             |

# How to run tests

A convenience script is provided to run automated tests in a containerised environment:

```
scripts/test
```

This runs tests via a `docker-compose run` command. If tests complete successfully, all containers, networks and volumes are cleaned up before the script exits. If there is an error or any tests fail, the associated Docker resources will be left available for inspection.

Alternatively, the same tests may be run locally via npm:

```
npm run test
```

# Running the application

The application is designed to run in containerised environments: Docker Compose for development; Kubernetes for production.

A Helm chart is provided for deployment to Kubernetes and scripts are provided for local development and testing.

## Build container image

Container images are built using Docker Compose and the same image may be run in either Docker Compose or Kubernetes.

The [`build`](./scripts/build) script is essentially a shortcut and will pass any arguments through to the `docker-compose build` command.

```
# Build images using default Docker behaviour
scripts/build

# Build images without using the Docker cache
scripts/build --no-cache
```

## Run as an isolated service

To test this service in isolation, use the provided scripts to start and stop a local instance. This relies on Docker Compose and will run direct dependencies, such as message queues and databases, as additional containers. Arguments given to the [`start`](./scripts/start) script will be passed through to the `docker-compose up` command.

```
# Start the service and attach to running containers (press `ctrl + c` to quit)
scripts/start

# Start the service without attaching to containers
scripts/start --detach

# Stop the service and remove Docker volumes and networks created by the start script
scripts/stop
```

## Connect to sibling services

To test this service in combination with other parts of the FFC demo application, it is necessary to connect each service to an external Docker network and shared dependencies, such as message queues. Start the shared dependencies from the [`mine-support-development`](https://github.com/DEFRA/mine-support-development) repository and then use the `connected-` [`scripts`](./scripts/) to start this service. Follow instructions in other repositories to connect each service to the shared dependencies and network.

```
# Start the service
script/connected-start

# Stop the service
script/connected-stop
```

## Deploy to Kubernetes

For production deployments, a helm chart is included in the `.\helm` folder. This service connects to an AMQP 1.0 message broker, using credentials defined in [values.yaml](./helm/values.yaml), which must be made available prior to deployment.

Scripts are provided to test the Helm chart by deploying the service, along with an appropriate message broker, into the current Helm/Kubernetes context.

```
# Deploy to current Kubernetes context
scripts/helm/install

# Remove from current Kubernetes context
scripts/helm/delete
```

### Redis in Kubernetes

For local deployment testing, it may be helpful to run a Redis instance in your Kubernetes cluster, rather than setting up a remote Redis instance. To deploy Redis with appropriate configuration, use the official Redis HA Helm chart with the provided [`redis.yaml`](./redis.yaml) configuration file:

`helm install --namespace default --name redis -f redis.yaml stable/redis-ha`

This will deploy a single Redis instance with no affinities, allowing Redis nodes to reside on the same worker node, and no minimum slaves requirement. For information on the minimum slaves setting, see [this post](https://stackoverflow.com/questions/55365775/redis-ha-helm-chart-error-noreplicas-not-enough-good-replicas-to-write) on Stack Overflow.

### Probes

The service has both an Http readiness probe and an Http liveness probe configured to receive at the below end points.

Readiness: `/healthy`
Liveness: `/healthz`

### Basic Authentication

The ingress controller may be protected with basic authentication by setting the `auth` value exposed by [values.yaml](./helm/values.yaml) on deployment.

The provided auth string must be an htpasswd encoded for use in the data field of a Kubernetes secret.

To generate the correct format auth token first create a username and password using htpasswd.
Below shows creating a password for the user 'defra'.

`htpasswd -c ./auth defra`

Upon hitting return you will be prompted to enter a password for the user.
A Secret can then be created in Kubernetes directly from the `./auth` file:

`kubectl create secret generic basic-auth --namespace default --from-file auth`

The secret can be viewed with the command:

`kubectl get secret basic-auth -o yaml`

The encoded, encrypted, username and password will be shown in the auth field of the data section.

```
apiVersion: v1
data:
  auth: xyzabc
kind: Secret
metadata:
...
```

In the example above the value of `auth` would be need to be set to `xyzabc` to use the generated credentials.

Setting the new auth value while deploying the Helm chart will prompt a user to enter the username and password when visiting the web site.

A utility script is provided to aid in deploying locally using basic authentication.

First build the container

`./scripts/build`

export the generated auth token as the environment variable MINE_BASIC_AUTH, i.e.:

`export MINE_BASIC_AUTH=xyzabc`

deploy to the current Helm context

`./scripts/deploy`

## Running without containers

The application may be run natively on the local operating if a Redis server is available on `localhost:6379`. First build the application using:

`$ npm run build`

Now the application is ready to run:

`$ node index.js`

# Build Pipeline

The [azure-pipelines.yaml](azure-pipelines.yaml) performs the following tasks:
- Runs unit tests
- Publishes test result
- Pushes containers to the registry tagged with the PR number or release version
- Deploys PRs to a temporary end point for review
- Deletes PR deployments, containers, and namepace upon merge

Builds will be deployed into a namespace with the format `ffc-demo-{identifier}` where `{identifier}` is either the release version, the PR number, or the branch name.

The builds will be available at the URL `http://ffc-demo-{identifier}.{ingress-server}`, where `{ingress-server}` is the ingress server defined the [`values.yaml`](./helm/values.yaml),  which is `vividcloudsolutions.co.uk` by default.

The temporary deployment requires a CNAME subdomain wildcard pointing to the public IP address of the ingress controller of the Kubernetes cluster. This can be simulated by updating your local `hosts` file with an entry for the build address set to the ingress controller's public IP address. On windows this would mean adding a line to `C:\Windows\System32\drivers\etc\hosts`, i.e. for PR 8 against the default ingress server this would be

xx.xx.xx.xx mine-support-pr8.vividcloudsolutions.co.uk

where `xx.xx.xx.xx` is the public IP Address of the Ingress Controller.

A detailed description on the build pipeline and PR work flow is available in the [Defra Confluence page](https://eaflood.atlassian.net/wiki/spaces/FFCPD/pages/1281359920/Build+Pipeline+and+PR+Workflow)
