using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autodesk.Forge;
using Autodesk.Forge.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace WebApplication.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ViewablesController : ControllerBase
    {
        private readonly ForgeConfiguration _configuration;
        public ViewablesController(IOptions<ForgeConfiguration> configuration)
        {
            _configuration = configuration.Value;
        }

        [HttpGet("token")]
        public async Task<string> ListAsync()
        {
            var twoLeggedApi = new TwoLeggedApi();
            Autodesk.Forge.Client.ApiResponse<dynamic> response = 
                await twoLeggedApi.AuthenticateAsyncWithHttpInfo(
                    _configuration.ClientId, 
                    _configuration.ClientSecret, 
                    oAuthConstants.CLIENT_CREDENTIALS, 
                    new Scope[] { Scope.ViewablesRead });

            // The JSON response from the oAuth server is the Data variable 
            // and has already been parsed into a DynamicDictionary object.
            dynamic bearer = response.Data;
            return bearer.access_token;
        }
    }
}