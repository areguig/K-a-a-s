package com.kaas.resource;

import com.kaas.model.KarateRequest;
import com.kaas.model.KarateResponse;
import com.kaas.service.KarateService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.jboss.logging.Logger;

@Path("/karate")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class KarateResource {
    private static final Logger LOG = Logger.getLogger(KarateResource.class);

    @Inject
    KarateService karateService;

    @POST
    @Path("/execute")
    public KarateResponse execute(@Valid KarateRequest request) {
        LOG.info("Executing Karate test");
        return karateService.executeKarateTest(request);
    }

    @GET
    @Path("/versions")
    public KarateService.Versions versions() {
        return karateService.getVersions();
    }

    @GET
    @Path("/health")
    public String health() {
        return "OK";
    }

    @GET
    @Path("/info")
    public String info() {
        return "Karate Test Service";
    }
}
